import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSmsWithProvider } from "@/lib/sms/provider";

const CHANNELS = ["sms", "email", "voice", "push", "in_app"] as const;

type Channel = (typeof CHANNELS)[number];
type DeliveryStatus = "pending" | "queued" | "sent" | "delivered" | "failed" | "cancelled";

type DispatchBody = {
  limit?: number;
  channel?: Channel;
};

type DeliveryRow = {
  id: string;
  channel: Channel;
  destination: string | null;
  metadata: Record<string, unknown> | null;
};

type DispatchResult = {
  status: DeliveryStatus;
  providerName: string;
  providerMessageId: string;
  errorMessage?: string;
};

function getDispatchMessage(metadata: Record<string, unknown> | null): string {
  const notificationType = typeof metadata?.notificationType === "string" ? metadata.notificationType : "notification";
  if (notificationType === "appointment_confirmation") {
    return "Your appointment has been confirmed.";
  }
  if (notificationType === "appointment_reminder") {
    return "Reminder: you have an upcoming appointment.";
  }
  return "You have a new notification from MedConnect Pro.";
}

function isChannel(value: string): value is Channel {
  return CHANNELS.includes(value as Channel);
}

async function dispatchDelivery(delivery: DeliveryRow): Promise<DispatchResult> {
  if (delivery.channel === "sms") {
    if (!delivery.destination) {
      return {
        status: "failed",
        providerName: "generic_sms_provider",
        providerMessageId: randomUUID(),
        errorMessage: "Missing SMS destination"
      };
    }

    try {
      const smsResult = await sendSmsWithProvider({
        to: delivery.destination,
        body: getDispatchMessage(delivery.metadata),
        metadata: delivery.metadata ?? {}
      });

      return {
        status: smsResult.status,
        providerName: smsResult.providerName,
        providerMessageId: smsResult.providerMessageId
      };
    } catch (error) {
      return {
        status: "failed",
        providerName: "generic_sms_provider",
        providerMessageId: randomUUID(),
        errorMessage: error instanceof Error ? error.message : "Unknown SMS error"
      };
    }
  }

  if (delivery.channel === "in_app") {
    return {
      status: "delivered",
      providerName: "medconnect_in_app",
      providerMessageId: randomUUID()
    };
  }

  return {
    status: "sent",
    providerName: `mock_${delivery.channel}_provider`,
    providerMessageId: randomUUID()
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DispatchBody | null;
  const limit = Math.min(Math.max(body?.limit ?? 20, 1), 100);

  if (body?.channel && !isChannel(body.channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  let query = supabase
    .from("notification_deliveries")
    .select("id, channel, destination, metadata")
    .eq("status", "pending")
    .order("requested_at", { ascending: true })
    .limit(limit);

  if (body?.channel) {
    query = query.eq("channel", body.channel);
  }

  const { data: deliveries, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (deliveries ?? []) as DeliveryRow[];
  let successCount = 0;
  let failedCount = 0;

  const updates = await Promise.all(
    rows.map(async (delivery) => {
      const result = await dispatchDelivery(delivery);
      if (result.status === "failed") {
        failedCount += 1;
      } else {
        successCount += 1;
      }

      return {
        id: delivery.id,
        status: result.status,
        provider_name: result.providerName,
        provider_message_id: result.providerMessageId,
        error_message: result.errorMessage ?? null,
        completed_at: result.status === "failed" ? null : new Date().toISOString()
      };
    })
  );

  for (const update of updates) {
    const { error: updateError } = await supabase.from("notification_deliveries").update(update).eq("id", update.id);
    if (updateError) {
      failedCount += 1;
    }
  }

  return NextResponse.json({
    data: {
      processed: rows.length,
      successful: successCount,
      failed: failedCount
    }
  });
}

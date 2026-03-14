import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSmsWithProvider } from "@/lib/sms/provider";
import { logAuditEvent } from "@/lib/audit/log";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SendSmsRequest = {
  threadId?: string;
  bodyCiphertext?: string;
  bodyPreview?: string;
  to?: string;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SendSmsRequest | null;

  if (!body?.threadId || !body?.bodyCiphertext || typeof body.bodyCiphertext !== "string") {
    return NextResponse.json({ error: "threadId and bodyCiphertext are required" }, { status: 400 });
  }

  if (!isUuid(body.threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  const { data: thread, error: threadError } = await supabase
    .from("message_threads")
    .select("id, organization_id, patient_id, patients!inner(phone)")
    .eq("id", body.threadId)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found or access denied" }, { status: 404 });
  }

  const patient = Array.isArray(thread.patients) ? thread.patients[0] : thread.patients;
  const destination = body.to?.trim() || patient?.phone;
  if (!destination) {
    return NextResponse.json({ error: "No destination phone available for patient" }, { status: 400 });
  }

  const providerResponse = await sendSmsWithProvider({
    to: destination,
    body: body.bodyPreview?.trim() || "[Encrypted message]",
    metadata: {
      threadId: thread.id,
      organizationId: thread.organization_id,
      patientId: thread.patient_id
    }
  }).catch((error: unknown) => {
    return {
      error: error instanceof Error ? error.message : "Unknown SMS provider error"
    };
  });

  if ("error" in providerResponse) {
    return NextResponse.json({ error: providerResponse.error }, { status: 502 });
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      sender_user_id: user.id,
      channel: "sms",
      direction: "outbound",
      body_ciphertext: body.bodyCiphertext,
      body_preview: body.bodyPreview?.trim() ? body.bodyPreview.trim() : null,
      external_message_id: providerResponse.providerMessageId,
      metadata: { provider: providerResponse.providerName }
    })
    .select("id, thread_id, sender_user_id, channel, direction, body_preview, external_message_id, sent_at, created_at")
    .single();

  if (messageError || !message) {
    return NextResponse.json({ error: messageError?.message ?? "Failed to persist outbound message" }, { status: 400 });
  }

  const { error: deliveryError } = await supabase.from("notification_deliveries").insert({
    organization_id: thread.organization_id,
    patient_id: thread.patient_id,
    message_id: message.id,
    channel: "sms",
    destination,
    provider_name: providerResponse.providerName,
    provider_message_id: providerResponse.providerMessageId,
    status: providerResponse.status
  });

  if (deliveryError) {
    return NextResponse.json({ error: deliveryError.message }, { status: 400 });
  }

  await logAuditEvent({
    organizationId: thread.organization_id,
    actorUserId: user.id,
    action: "message.sms_outbound",
    resourceType: "message",
    resourceId: message.id,
    phiAccessed: true,
    details: {
      threadId: thread.id,
      patientId: thread.patient_id,
      destination,
      providerMessageId: providerResponse.providerMessageId
    }
  });

  return NextResponse.json({
    data: {
      message,
      delivery: {
        channel: "sms",
        destination,
        providerMessageId: providerResponse.providerMessageId,
        status: providerResponse.status
      }
    }
  });
}

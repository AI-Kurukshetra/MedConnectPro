import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CHANNELS = ["sms", "email", "voice", "push", "in_app"] as const;

type Channel = (typeof CHANNELS)[number];

type CreateNotificationBody = {
  organizationId?: string;
  patientId?: string;
  channel?: Channel;
  destination?: string | null;
  metadata?: Record<string, unknown>;
};

function isChannel(value: string): value is Channel {
  return CHANNELS.includes(value as Channel);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const channel = searchParams.get("channel");
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "25", 10), 1), 100);

  let query = supabase
    .from("notification_deliveries")
    .select(
      "id, organization_id, patient_id, channel, destination, provider_name, provider_message_id, status, requested_at, completed_at, error_message, metadata"
    )
    .order("requested_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (channel) {
    if (!isChannel(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    query = query.eq("channel", channel);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateNotificationBody | null;
  if (!body?.organizationId || !body.channel) {
    return NextResponse.json({ error: "organizationId and channel are required" }, { status: 400 });
  }

  if (!isChannel(body.channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("notification_deliveries")
    .insert({
      organization_id: body.organizationId,
      patient_id: body.patientId ?? null,
      channel: body.channel,
      destination: body.destination?.trim() ? body.destination.trim() : null,
      status: "pending",
      metadata: body.metadata ?? {}
    })
    .select(
      "id, organization_id, patient_id, channel, destination, provider_name, provider_message_id, status, requested_at, completed_at, error_message, metadata"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

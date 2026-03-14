import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type MessageChannel = "in_app" | "sms" | "email" | "voice" | "push";
type MessageDirection = "inbound" | "outbound";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MESSAGE_CHANNELS: MessageChannel[] = ["in_app", "sms", "email", "voice", "push"];

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await context.params;
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 50), 200);
  const offset = Math.max(parsePositiveInt(searchParams.get("offset"), 0), 0);

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, thread_id, sender_user_id, channel, direction, body_ciphertext, body_preview, external_message_id, metadata, sent_at, created_at"
    )
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request, context: { params: Promise<{ threadId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await context.params;
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        bodyCiphertext?: string;
        bodyPreview?: string;
        channel?: MessageChannel;
        direction?: MessageDirection;
        externalMessageId?: string;
        metadata?: Record<string, unknown>;
      }
    | null;

  if (!body?.bodyCiphertext || typeof body.bodyCiphertext !== "string") {
    return NextResponse.json({ error: "bodyCiphertext is required" }, { status: 400 });
  }

  const channel = body.channel ?? "in_app";
  if (!MESSAGE_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const direction = body.direction ?? "outbound";
  if (direction !== "inbound" && direction !== "outbound") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: user.id,
      body_ciphertext: body.bodyCiphertext,
      body_preview: body.bodyPreview?.trim() ? body.bodyPreview.trim() : null,
      channel,
      direction,
      external_message_id: body.externalMessageId?.trim() ? body.externalMessageId.trim() : null,
      metadata: body.metadata ?? {}
    })
    .select(
      "id, thread_id, sender_user_id, channel, direction, body_ciphertext, body_preview, external_message_id, metadata, sent_at, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

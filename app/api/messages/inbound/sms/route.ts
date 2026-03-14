import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/sms/security";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type InboundWebhookPayload = {
  organizationId?: string;
  threadId?: string;
  from?: string;
  to?: string;
  bodyCiphertext?: string;
  bodyPreview?: string;
  externalMessageId?: string;
  receivedAt?: string;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, "");
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const isValidSignature = verifyWebhookSignature(request.headers, rawBody);
  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody) as InboundWebhookPayload;
    } catch {
      return null;
    }
  })();
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
  if (!body.organizationId || !isUuid(body.organizationId)) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  if (!body.from || !body.bodyCiphertext) {
    return NextResponse.json({ error: "from and bodyCiphertext are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const fromPhone = normalizePhone(body.from);

  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id, profile_id")
    .eq("organization_id", body.organizationId)
    .eq("phone", fromPhone)
    .single();

  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found for inbound phone number" }, { status: 404 });
  }

  if (!patient.profile_id) {
    return NextResponse.json({ error: "Inbound SMS requires a linked patient profile_id" }, { status: 409 });
  }

  let threadId = body.threadId;
  if (!threadId) {
    const { data: existingThread } = await admin
      .from("message_threads")
      .select("id")
      .eq("organization_id", body.organizationId)
      .eq("patient_id", patient.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingThread?.id) {
      threadId = existingThread.id;
    }
  }

  if (!threadId) {
    const { data: createdThread, error: threadCreateError } = await admin
      .from("message_threads")
      .insert({
        organization_id: body.organizationId,
        patient_id: patient.id,
        subject: "SMS conversation",
        created_by: patient.profile_id
      })
      .select("id")
      .single();

    if (threadCreateError || !createdThread) {
      return NextResponse.json({ error: threadCreateError?.message ?? "Failed to create thread" }, { status: 400 });
    }

    threadId = createdThread.id;
  }

  if (!threadId || !isUuid(threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();
  if (Number.isNaN(receivedAt.getTime())) {
    return NextResponse.json({ error: "Invalid receivedAt timestamp" }, { status: 400 });
  }

  const { data: insertedMessage, error: messageError } = await admin
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: patient.profile_id,
      channel: "sms",
      direction: "inbound",
      body_ciphertext: body.bodyCiphertext,
      body_preview: body.bodyPreview?.trim() ? body.bodyPreview.trim() : null,
      external_message_id: body.externalMessageId?.trim() ? body.externalMessageId.trim() : null,
      metadata: {
        from: fromPhone,
        to: body.to ? normalizePhone(body.to) : null
      },
      sent_at: receivedAt.toISOString()
    })
    .select("id, thread_id, channel, direction, body_preview, external_message_id, sent_at, created_at")
    .single();

  if (messageError || !insertedMessage) {
    return NextResponse.json({ error: messageError?.message ?? "Failed to create inbound message" }, { status: 400 });
  }

  const { error: updateThreadError } = await admin
    .from("message_threads")
    .update({ updated_at: receivedAt.toISOString() })
    .eq("id", threadId);

  if (updateThreadError) {
    return NextResponse.json({ error: updateThreadError.message }, { status: 400 });
  }

  return NextResponse.json({ data: insertedMessage }, { status: 201 });
}

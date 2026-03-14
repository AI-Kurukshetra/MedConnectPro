import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EHR_ENTITY_TYPES = ["appointment", "message"] as const;
const EHR_DIRECTIONS = ["inbound", "outbound"] as const;

type EhrEntityType = (typeof EHR_ENTITY_TYPES)[number];
type EhrDirection = (typeof EHR_DIRECTIONS)[number];

type SyncBody = {
  organizationId?: string;
  entityType?: EhrEntityType;
  entityId?: string;
  direction?: EhrDirection;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isEhrEntityType(value: string): value is EhrEntityType {
  return EHR_ENTITY_TYPES.includes(value as EhrEntityType);
}

function isEhrDirection(value: string): value is EhrDirection {
  return EHR_DIRECTIONS.includes(value as EhrDirection);
}

async function mapEntityPayload(supabase: Awaited<ReturnType<typeof createClient>>, entityType: EhrEntityType, entityId: string) {
  if (entityType === "appointment") {
    const { data, error } = await supabase
      .from("appointments")
      .select("id, patient_id, provider_user_id, starts_at, ends_at, status, notes, created_at, updated_at")
      .eq("id", entityId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      resourceType: "Appointment",
      resourceId: data.id,
      patientId: data.patient_id,
      providerUserId: data.provider_user_id,
      start: data.starts_at,
      end: data.ends_at,
      status: data.status,
      notes: data.notes,
      updatedAt: data.updated_at,
      createdAt: data.created_at
    };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, thread_id, sender_user_id, channel, direction, body_preview, sent_at, created_at")
    .eq("id", entityId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    resourceType: "Communication",
    resourceId: data.id,
    threadId: data.thread_id,
    senderUserId: data.sender_user_id,
    channel: data.channel,
    direction: data.direction,
    preview: data.body_preview,
    sentAt: data.sent_at,
    createdAt: data.created_at
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

  const body = (await request.json().catch(() => null)) as SyncBody | null;
  if (!body?.organizationId || !body.entityType || !body.entityId) {
    return NextResponse.json({ error: "organizationId, entityType, and entityId are required" }, { status: 400 });
  }

  if (!isUuid(body.organizationId) || !isUuid(body.entityId)) {
    return NextResponse.json({ error: "Invalid organizationId or entityId" }, { status: 400 });
  }

  if (!isEhrEntityType(body.entityType)) {
    return NextResponse.json({ error: "Invalid entityType" }, { status: 400 });
  }

  const direction = body.direction ?? "outbound";
  if (!isEhrDirection(direction)) {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const { data: connection, error: connectionError } = await supabase
    .from("ehr_connections")
    .select("id, status")
    .eq("organization_id", body.organizationId)
    .single();

  if (connectionError || !connection) {
    return NextResponse.json({ error: "EHR connection not found for organization" }, { status: 404 });
  }

  if (connection.status !== "active") {
    return NextResponse.json({ error: "EHR connection is not active" }, { status: 409 });
  }

  const payload = await mapEntityPayload(supabase, body.entityType, body.entityId);
  if (!payload) {
    return NextResponse.json({ error: `${body.entityType} entity not found` }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("ehr_sync_events")
    .insert({
      connection_id: connection.id,
      organization_id: body.organizationId,
      entity_type: body.entityType,
      entity_id: body.entityId,
      direction,
      status: "pending",
      payload
    })
    .select("id, connection_id, organization_id, entity_type, entity_id, direction, status, payload, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APPOINTMENT_STATUSES = ["scheduled", "confirmed", "cancelled", "completed", "no_show"] as const;

type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

type UpdateAppointmentBody = {
  providerUserId?: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  status?: AppointmentStatus;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
}

export async function GET(_: Request, context: { params: Promise<{ appointmentId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId } = await context.params;
  if (!isUuid(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointmentId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("id, organization_id, patient_id, provider_user_id, starts_at, ends_at, status, notes, created_by, created_at, updated_at")
    .eq("id", appointmentId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, context: { params: Promise<{ appointmentId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointmentId } = await context.params;
  if (!isUuid(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointmentId" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as UpdateAppointmentBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.providerUserId !== undefined) {
    if (!isUuid(body.providerUserId)) {
      return NextResponse.json({ error: "Invalid providerUserId" }, { status: 400 });
    }
    updates.provider_user_id = body.providerUserId;
  }

  if (body.startsAt !== undefined) {
    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
    }
    updates.starts_at = startsAt.toISOString();
  }

  if (body.endsAt !== undefined) {
    const endsAt = new Date(body.endsAt);
    if (Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "Invalid endsAt" }, { status: 400 });
    }
    updates.ends_at = endsAt.toISOString();
  }

  if (updates.starts_at && updates.ends_at && new Date(String(updates.ends_at)) <= new Date(String(updates.starts_at))) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes.trim() ? body.notes.trim() : null;
  }

  if (body.status !== undefined) {
    if (!isAppointmentStatus(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId)
    .select("id, organization_id, patient_id, provider_user_id, starts_at, ends_at, status, notes, created_by, created_at, updated_at")
    .single();

  if (error) {
    if (error.message.includes("appointments_provider_no_overlap")) {
      return NextResponse.json({ error: "Provider already has an overlapping appointment" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

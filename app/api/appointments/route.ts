import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APPOINTMENT_STATUSES = ["scheduled", "confirmed", "cancelled", "completed", "no_show"] as const;

type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

type CreateAppointmentBody = {
  organizationId?: string;
  patientId?: string;
  providerUserId?: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  status?: AppointmentStatus;
};

type NotificationChannel = "in_app" | "sms" | "email" | "voice" | "push";

type PatientContact = {
  phone: string | null;
  email: string | null;
};

type PatientNotificationPreferences = {
  allow_sms: boolean;
  allow_email: boolean;
  allow_voice: boolean;
  allow_push: boolean;
};

function getConfirmationChannels(
  patient: PatientContact,
  preferences: PatientNotificationPreferences | null
): NotificationChannel[] {
  const channels = new Set<NotificationChannel>(["in_app"]);

  const allowSms = preferences?.allow_sms ?? true;
  const allowEmail = preferences?.allow_email ?? true;
  const allowVoice = preferences?.allow_voice ?? false;
  const allowPush = preferences?.allow_push ?? false;

  if (allowSms && patient.phone) {
    channels.add("sms");
  }

  if (allowEmail && patient.email) {
    channels.add("email");
  }

  if (allowVoice && patient.phone) {
    channels.add("voice");
  }

  if (allowPush) {
    channels.add("push");
  }

  return Array.from(channels);
}

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

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus);
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
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 25), 100);
  const offset = Math.max(parsePositiveInt(searchParams.get("offset"), 0), 0);

  const organizationId = searchParams.get("organizationId");
  const patientId = searchParams.get("patientId");
  const providerUserId = searchParams.get("providerUserId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("appointments")
    .select("id, organization_id, patient_id, provider_user_id, starts_at, ends_at, status, notes, created_by, created_at, updated_at")
    .order("starts_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (organizationId) {
    if (!isUuid(organizationId)) {
      return NextResponse.json({ error: "Invalid organizationId" }, { status: 400 });
    }
    query = query.eq("organization_id", organizationId);
  }

  if (patientId) {
    if (!isUuid(patientId)) {
      return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
    }
    query = query.eq("patient_id", patientId);
  }

  if (providerUserId) {
    if (!isUuid(providerUserId)) {
      return NextResponse.json({ error: "Invalid providerUserId" }, { status: 400 });
    }
    query = query.eq("provider_user_id", providerUserId);
  }

  if (status) {
    if (!isAppointmentStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  if (from) {
    const fromDate = new Date(from);
    if (Number.isNaN(fromDate.getTime())) {
      return NextResponse.json({ error: "Invalid from" }, { status: 400 });
    }
    query = query.gte("starts_at", fromDate.toISOString());
  }

  if (to) {
    const toDate = new Date(to);
    if (Number.isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Invalid to" }, { status: 400 });
    }
    query = query.lte("starts_at", toDate.toISOString());
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

  const body = (await request.json().catch(() => null)) as CreateAppointmentBody | null;
  if (!body?.organizationId || !body.patientId || !body.providerUserId || !body.startsAt || !body.endsAt) {
    return NextResponse.json(
      { error: "organizationId, patientId, providerUserId, startsAt, and endsAt are required" },
      { status: 400 }
    );
  }

  if (!isUuid(body.organizationId) || !isUuid(body.patientId) || !isUuid(body.providerUserId)) {
    return NextResponse.json({ error: "Invalid UUID fields" }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: "Invalid startsAt/endsAt range" }, { status: 400 });
  }

  const status: AppointmentStatus = body.status && isAppointmentStatus(body.status) ? body.status : "scheduled";

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: body.organizationId,
      patient_id: body.patientId,
      provider_user_id: body.providerUserId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: body.notes?.trim() ? body.notes.trim() : null,
      status,
      created_by: user.id
    })
    .select("id, organization_id, patient_id, provider_user_id, starts_at, ends_at, status, notes, created_by, created_at, updated_at")
    .single();

  if (error) {
    if (error.message.includes("appointments_provider_no_overlap")) {
      return NextResponse.json({ error: "Provider already has an overlapping appointment" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: patientContact } = await supabase
    .from("patients")
    .select("phone, email")
    .eq("id", body.patientId)
    .single();

  const { data: notificationPreferences } = await supabase
    .from("patient_notification_preferences")
    .select("allow_sms, allow_email, allow_voice, allow_push")
    .eq("patient_id", body.patientId)
    .maybeSingle();

  const channels = getConfirmationChannels(
    {
      phone: patientContact?.phone ?? null,
      email: patientContact?.email ?? null
    },
    notificationPreferences
      ? {
          allow_sms: Boolean(notificationPreferences.allow_sms),
          allow_email: Boolean(notificationPreferences.allow_email),
          allow_voice: Boolean(notificationPreferences.allow_voice),
          allow_push: Boolean(notificationPreferences.allow_push)
        }
      : null
  );

  const notificationRows = channels.map((channel) => ({
    organization_id: body.organizationId,
    patient_id: body.patientId,
    channel,
    destination: channel === "email" ? patientContact?.email ?? null : patientContact?.phone ?? null,
    status: "pending",
    metadata: {
      notificationType: "appointment_confirmation",
      appointmentId: data.id,
      startsAt: data.starts_at,
      endsAt: data.ends_at
    }
  }));

  if (notificationRows.length > 0) {
    const { error: notificationError } = await supabase.from("notification_deliveries").insert(notificationRows);
    if (notificationError) {
      return NextResponse.json(
        {
          data,
          warning: "Appointment created but confirmation notifications failed to enqueue",
          warningDetails: notificationError.message
        },
        { status: 201 }
      );
    }
  }

  await logAuditEvent({
    organizationId: data.organization_id,
    actorUserId: user.id,
    action: "appointment.created",
    resourceType: "appointment",
    resourceId: data.id,
    phiAccessed: true,
    details: {
      patientId: data.patient_id,
      providerUserId: data.provider_user_id,
      startsAt: data.starts_at,
      status: data.status,
      confirmationChannelsQueued: channels
    }
  });

  return NextResponse.json({ data, confirmationChannelsQueued: channels }, { status: 201 });
}

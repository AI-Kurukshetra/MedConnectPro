import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PreferencePayload = {
  organizationId?: string;
  patientId?: string;
  allowSms?: boolean;
  allowEmail?: boolean;
  allowVoice?: boolean;
  allowPush?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function parseTimeOrNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return null;
  }

  return value.length === 5 ? `${value}:00` : value;
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
  const patientId = searchParams.get("patientId");
  if (!patientId || !isUuid(patientId)) {
    return NextResponse.json({ error: "Valid patientId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("patient_notification_preferences")
    .select(
      "id, organization_id, patient_id, allow_sms, allow_email, allow_voice, allow_push, quiet_hours_start, quiet_hours_end, created_at, updated_at"
    )
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({
      data: {
        patientId,
        allowSms: true,
        allowEmail: true,
        allowVoice: false,
        allowPush: false,
        quietHoursStart: null,
        quietHoursEnd: null
      }
    });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      organizationId: data.organization_id,
      patientId: data.patient_id,
      allowSms: data.allow_sms,
      allowEmail: data.allow_email,
      allowVoice: data.allow_voice,
      allowPush: data.allow_push,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PreferencePayload | null;
  if (!body?.organizationId || !body.patientId) {
    return NextResponse.json({ error: "organizationId and patientId are required" }, { status: 400 });
  }

  if (!isUuid(body.organizationId) || !isUuid(body.patientId)) {
    return NextResponse.json({ error: "Invalid organizationId or patientId" }, { status: 400 });
  }

  const quietHoursStart = parseTimeOrNull(body.quietHoursStart);
  const quietHoursEnd = parseTimeOrNull(body.quietHoursEnd);

  if (
    (body.quietHoursStart !== undefined && body.quietHoursStart !== null && quietHoursStart === null) ||
    (body.quietHoursEnd !== undefined && body.quietHoursEnd !== null && quietHoursEnd === null)
  ) {
    return NextResponse.json({ error: "Invalid quiet hours format; expected HH:MM or HH:MM:SS" }, { status: 400 });
  }

  const upsertPayload = {
    organization_id: body.organizationId,
    patient_id: body.patientId,
    allow_sms: body.allowSms ?? true,
    allow_email: body.allowEmail ?? true,
    allow_voice: body.allowVoice ?? false,
    allow_push: body.allowPush ?? false,
    quiet_hours_start: quietHoursStart,
    quiet_hours_end: quietHoursEnd
  };

  const { data, error } = await supabase
    .from("patient_notification_preferences")
    .upsert(upsertPayload, { onConflict: "patient_id" })
    .select(
      "id, organization_id, patient_id, allow_sms, allow_email, allow_voice, allow_push, quiet_hours_start, quiet_hours_end, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      organizationId: data.organization_id,
      patientId: data.patient_id,
      allowSms: data.allow_sms,
      allowEmail: data.allow_email,
      allowVoice: data.allow_voice,
      allowPush: data.allow_push,
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  });
}

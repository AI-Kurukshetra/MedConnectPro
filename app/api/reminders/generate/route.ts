import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REMINDER_CHANNELS = ["in_app", "sms", "email", "voice", "push"] as const;

type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

type GenerateReminderBody = {
  appointmentId?: string;
};

type ReminderRule = {
  channel: ReminderChannel;
  minutes_before: number;
};

type PatientPreferences = {
  allow_sms: boolean;
  allow_email: boolean;
  allow_voice: boolean;
  allow_push: boolean;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isChannelAllowed(channel: ReminderChannel, preferences: PatientPreferences | null): boolean {
  if (channel === "in_app") {
    return true;
  }

  if (!preferences) {
    return channel === "sms" || channel === "email";
  }

  if (channel === "sms") {
    return preferences.allow_sms;
  }
  if (channel === "email") {
    return preferences.allow_email;
  }
  if (channel === "voice") {
    return preferences.allow_voice;
  }

  return preferences.allow_push;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as GenerateReminderBody | null;
  if (!body?.appointmentId || !isUuid(body.appointmentId)) {
    return NextResponse.json({ error: "Valid appointmentId is required" }, { status: 400 });
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, organization_id, patient_id, starts_at")
    .eq("id", body.appointmentId)
    .single();

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Appointment not found or inaccessible" }, { status: 404 });
  }

  const { data: rules, error: ruleError } = await supabase
    .from("reminder_rules")
    .select("channel, minutes_before")
    .eq("organization_id", appointment.organization_id)
    .eq("is_enabled", true);

  if (ruleError) {
    return NextResponse.json({ error: ruleError.message }, { status: 400 });
  }

  const { data: preferences } = await supabase
    .from("patient_notification_preferences")
    .select("allow_sms, allow_email, allow_voice, allow_push")
    .eq("patient_id", appointment.patient_id)
    .maybeSingle();

  const startsAt = new Date(appointment.starts_at);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Appointment starts_at is invalid" }, { status: 400 });
  }

  const reminderRules: ReminderRule[] = (rules ?? [])
    .map((rule) => {
      const channel = String(rule.channel) as ReminderChannel;
      const minutesBefore = Number(rule.minutes_before);
      if (!REMINDER_CHANNELS.includes(channel) || !Number.isFinite(minutesBefore) || minutesBefore <= 0) {
        return null;
      }
      return {
        channel,
        minutes_before: minutesBefore
      };
    })
    .filter((rule): rule is ReminderRule => rule !== null)
    .filter((rule) => isChannelAllowed(rule.channel, preferences ?? null));

  if (reminderRules.length === 0) {
    return NextResponse.json({ data: { created: 0, skipped: "No enabled rules for patient preferences" } });
  }

  const reminderRows = reminderRules.map((rule) => ({
    appointment_id: appointment.id,
    channel: rule.channel,
    scheduled_for: new Date(startsAt.getTime() - rule.minutes_before * 60 * 1000).toISOString(),
    status: "pending"
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("appointment_reminders")
    .upsert(reminderRows, { onConflict: "appointment_id,channel,scheduled_for" })
    .select("id, appointment_id, channel, scheduled_for, status, created_at");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      created: inserted?.length ?? 0,
      reminders: inserted ?? []
    }
  });
}

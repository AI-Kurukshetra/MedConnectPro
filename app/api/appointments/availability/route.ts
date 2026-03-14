import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Slot = { startsAt: string; endsAt: string };

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function parseDayTimeToUtc(date: string, hhmm: string): Date | null {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) {
    return null;
  }

  const parsed = new Date(`${date}T${hhmm}:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function overlaps(slotStart: Date, slotEnd: Date, busyStart: Date, busyEnd: Date): boolean {
  return slotStart < busyEnd && slotEnd > busyStart;
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
  const organizationId = searchParams.get("organizationId");
  const providerUserId = searchParams.get("providerUserId");
  const date = searchParams.get("date");
  const dayStart = searchParams.get("dayStart") ?? "09:00";
  const dayEnd = searchParams.get("dayEnd") ?? "17:00";
  const slotMinutes = Number.parseInt(searchParams.get("slotMinutes") ?? "30", 10);

  if (!organizationId || !providerUserId || !date) {
    return NextResponse.json({ error: "organizationId, providerUserId, and date are required" }, { status: 400 });
  }

  if (!isUuid(organizationId) || !isUuid(providerUserId)) {
    return NextResponse.json({ error: "Invalid organizationId or providerUserId" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format, expected YYYY-MM-DD" }, { status: 400 });
  }

  if (!Number.isFinite(slotMinutes) || slotMinutes <= 0 || slotMinutes > 240) {
    return NextResponse.json({ error: "slotMinutes must be between 1 and 240" }, { status: 400 });
  }

  const rangeStart = parseDayTimeToUtc(date, dayStart);
  const rangeEnd = parseDayTimeToUtc(date, dayEnd);
  if (!rangeStart || !rangeEnd || rangeEnd <= rangeStart) {
    return NextResponse.json({ error: "Invalid dayStart/dayEnd range" }, { status: 400 });
  }

  const { data: busyAppointments, error } = await supabase
    .from("appointments")
    .select("starts_at, ends_at")
    .eq("organization_id", organizationId)
    .eq("provider_user_id", providerUserId)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", rangeEnd.toISOString())
    .gt("ends_at", rangeStart.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const busyRanges = (busyAppointments ?? [])
    .map((item) => {
      const busyStart = new Date(item.starts_at);
      const busyEnd = new Date(item.ends_at);
      if (Number.isNaN(busyStart.getTime()) || Number.isNaN(busyEnd.getTime())) {
        return null;
      }
      return { busyStart, busyEnd };
    })
    .filter((value): value is { busyStart: Date; busyEnd: Date } => value !== null);

  const slots: Slot[] = [];
  const slotMs = slotMinutes * 60 * 1000;
  for (let cursor = rangeStart.getTime(); cursor + slotMs <= rangeEnd.getTime(); cursor += slotMs) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor + slotMs);

    const isBusy = busyRanges.some(({ busyStart, busyEnd }) => overlaps(slotStart, slotEnd, busyStart, busyEnd));
    if (!isBusy) {
      slots.push({
        startsAt: slotStart.toISOString(),
        endsAt: slotEnd.toISOString()
      });
    }
  }

  return NextResponse.json({
    data: {
      organizationId,
      providerUserId,
      date,
      slotMinutes,
      dayStart,
      dayEnd,
      slots
    }
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
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
  const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 100);
  const offset = Math.max(parsePositiveInt(searchParams.get("offset"), 0), 0);

  const { data, error } = await supabase
    .from("message_threads")
    .select("id, organization_id, patient_id, subject, created_by, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

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

  const body = (await request.json().catch(() => null)) as
    | { organizationId?: string; patientId?: string; subject?: string }
    | null;

  if (!body?.organizationId || !body?.patientId) {
    return NextResponse.json({ error: "organizationId and patientId are required" }, { status: 400 });
  }

  if (!isUuid(body.organizationId) || !isUuid(body.patientId)) {
    return NextResponse.json({ error: "Invalid organizationId or patientId" }, { status: 400 });
  }

  const subject = body.subject?.trim();

  const { data, error } = await supabase
    .from("message_threads")
    .insert({
      organization_id: body.organizationId,
      patient_id: body.patientId,
      subject: subject ? subject : null,
      created_by: user.id
    })
    .select("id, organization_id, patient_id, subject, created_by, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

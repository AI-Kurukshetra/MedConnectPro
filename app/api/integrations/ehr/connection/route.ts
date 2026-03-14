import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONNECTION_STATUSES = ["active", "paused", "error"] as const;

type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

type UpsertConnectionBody = {
  organizationId?: string;
  providerName?: string;
  externalTenantId?: string | null;
  status?: ConnectionStatus;
};

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isConnectionStatus(value: string): value is ConnectionStatus {
  return CONNECTION_STATUSES.includes(value as ConnectionStatus);
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
  if (!organizationId || !isUuid(organizationId)) {
    return NextResponse.json({ error: "Valid organizationId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ehr_connections")
    .select("id, organization_id, provider_name, external_tenant_id, status, created_at, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as UpsertConnectionBody | null;
  if (!body?.organizationId || !body.providerName) {
    return NextResponse.json({ error: "organizationId and providerName are required" }, { status: 400 });
  }

  if (!isUuid(body.organizationId)) {
    return NextResponse.json({ error: "Invalid organizationId" }, { status: 400 });
  }

  if (body.status && !isConnectionStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ehr_connections")
    .upsert(
      {
        organization_id: body.organizationId,
        provider_name: body.providerName.trim(),
        external_tenant_id: body.externalTenantId?.trim() ? body.externalTenantId.trim() : null,
        status: body.status ?? "active"
      },
      { onConflict: "organization_id" }
    )
    .select("id, organization_id, provider_name, external_tenant_id, status, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

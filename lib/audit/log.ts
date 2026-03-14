import { createAdminClient } from "@/lib/supabase/admin";

type AuditEvent = {
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  actorUserId?: string | null;
  phiAccessed?: boolean;
  details?: Record<string, unknown>;
};

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      organization_id: event.organizationId,
      actor_user_id: event.actorUserId ?? null,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      phi_accessed: event.phiAccessed ?? false,
      details: event.details ?? {}
    });
  } catch {
    // Auditing should not break business flow in MVP mode.
  }
}

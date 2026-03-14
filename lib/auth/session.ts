import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 400;
const APP_ROLES = ["patient", "provider", "staff", "admin"] as const;
const PROVIDER_ROLES = ["provider", "staff", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

async function getUserWithTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("auth_timeout")), AUTH_TIMEOUT_MS);
    })
  ]);
}

async function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requireUser() {
  const supabase = await createClient();
  let user = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const authResult = await getUserWithTimeout(supabase.auth.getUser());
      user = authResult.data.user;
      break;
    } catch {
      if (attempt === 1) {
        redirect("/login?error=auth_unavailable");
      }
      await delay(RETRY_DELAY_MS);
    }
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function getCurrentUserRole(userId: string): Promise<AppRole | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = data?.role;

  if (typeof role !== "string" || !APP_ROLES.includes(role as AppRole)) {
    return null;
  }

  return role as AppRole;
}

export async function requireCurrentUserRole(): Promise<{ user: Awaited<ReturnType<typeof requireUser>>; role: AppRole }> {
  const user = await requireUser();
  const role = await getCurrentUserRole(user.id);

  if (!role) {
    redirect("/login");
  }

  return { user, role };
}

export async function requirePatientUser() {
  const { user, role } = await requireCurrentUserRole();
  if (role !== "patient") {
    redirect("/dashboard/provider");
  }

  return { user, role };
}

export async function requireProviderUser() {
  const { user, role } = await requireCurrentUserRole();
  if (!PROVIDER_ROLES.includes(role as (typeof PROVIDER_ROLES)[number])) {
    redirect("/dashboard/patient");
  }

  return { user, role };
}

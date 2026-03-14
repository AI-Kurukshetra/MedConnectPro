import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 600;
const AUTH_MAX_ATTEMPTS = 3;
const APP_ROLES = ["patient", "provider", "staff", "admin"] as const;
const PROVIDER_ROLES = ["provider", "staff", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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

export async function requireUser(existingClient?: SupabaseServerClient) {
  const supabase = existingClient ?? (await createClient());
  let user = null;

  for (let attempt = 0; attempt < AUTH_MAX_ATTEMPTS; attempt += 1) {
    try {
      const authResult = await getUserWithTimeout(supabase.auth.getUser());
      user = authResult.data.user;
      break;
    } catch {
      const sessionResult = await supabase.auth.getSession();
      user = sessionResult.data.session?.user ?? null;
      if (user) {
        break;
      }

      if (attempt === AUTH_MAX_ATTEMPTS - 1) {
        redirect("/login?error=auth_unavailable&next=/dashboard");
      }
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function getCurrentUserRole(userId: string, existingClient?: SupabaseServerClient): Promise<AppRole | null> {
  const supabase = existingClient ?? (await createClient());
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = data?.role;

  if (typeof role !== "string" || !APP_ROLES.includes(role as AppRole)) {
    return null;
  }

  return role as AppRole;
}

export async function requireCurrentUserRole(
  existingClient?: SupabaseServerClient
): Promise<{ user: Awaited<ReturnType<typeof requireUser>>; role: AppRole }> {
  const user = await requireUser(existingClient);
  const role = await getCurrentUserRole(user.id, existingClient);

  if (!role) {
    redirect("/login");
  }

  return { user, role };
}

export async function requirePatientUser(existingClient?: SupabaseServerClient) {
  const { user, role } = await requireCurrentUserRole(existingClient);
  if (role !== "patient") {
    redirect("/dashboard/provider");
  }

  return { user, role };
}

export async function requireProviderUser(existingClient?: SupabaseServerClient) {
  const { user, role } = await requireCurrentUserRole(existingClient);
  if (!PROVIDER_ROLES.includes(role as (typeof PROVIDER_ROLES)[number])) {
    redirect("/dashboard/patient");
  }

  return { user, role };
}

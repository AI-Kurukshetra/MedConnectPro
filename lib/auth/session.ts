import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 10000;
const RETRY_DELAY_MS = 400;

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

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const AUTH_TIMEOUT_MS = 7000;
const AUTH_RETRY_DELAY_MS = 400;

function getSafeNextPath(rawNext: FormDataEntryValue | null): string {
  if (typeof rawNext !== "string") {
    return "/dashboard";
  }

  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/dashboard";
  }

  return rawNext;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("auth_timeout")), timeoutMs);
    })
  ]);
}

async function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function signInWithPasswordAction(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const nextPath = getSafeNextPath(formData.get("next"));

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    redirect(`/login?error=invalid_form&next=${encodeURIComponent(nextPath)}`);
  }

  const email = emailValue.trim();
  const password = passwordValue;

  if (!email || !password) {
    redirect(`/login?error=missing_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  let authResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      authResult = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        AUTH_TIMEOUT_MS
      );
      break;
    } catch {
      if (attempt === 1) {
        redirect(`/login?error=auth_unavailable&next=${encodeURIComponent(nextPath)}`);
      }
      await delay(AUTH_RETRY_DELAY_MS);
    }
  }

  if (!authResult) {
    redirect(`/login?error=auth_unavailable&next=${encodeURIComponent(nextPath)}`);
  }

  const { error } = authResult;

  if (error) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

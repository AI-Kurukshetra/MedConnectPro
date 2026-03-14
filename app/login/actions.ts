"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(rawNext: FormDataEntryValue | null): string {
  if (typeof rawNext !== "string") {
    return "/dashboard";
  }

  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/dashboard";
  }

  return rawNext;
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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

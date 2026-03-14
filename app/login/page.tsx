import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInWithPasswordAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Login | MedConnect Pro"
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_form: "Form data is invalid. Please try again.",
  missing_credentials: "Please enter your email and password.",
  invalid_credentials: "Invalid email or password."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next && params.next.startsWith("/") ? params.next : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const errorMessage = params?.error ? errorMessages[params.error] : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-slate-600">Sign in to access protected dashboard routes.</p>
      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      <form action={signInWithPasswordAction} className="flex flex-col gap-3 rounded-lg border p-4">
        <input name="next" type="hidden" value={nextPath} />
        <label className="flex flex-col gap-1 text-sm">
          <span>Email</span>
          <input
            autoComplete="email"
            className="rounded-md border px-3 py-2"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Password</span>
          <input
            autoComplete="current-password"
            className="rounded-md border px-3 py-2"
            name="password"
            required
            type="password"
          />
        </label>
        <button className="rounded-md border bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}

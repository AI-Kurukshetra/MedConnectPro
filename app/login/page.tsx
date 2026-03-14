import type { Metadata } from "next";
import { signInWithPasswordAction } from "@/app/login/actions";

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
  invalid_credentials: "Invalid email or password.",
  session_timeout: "Session check timed out. Please sign in again.",
  auth_unavailable: "Authentication service is slow right now. Please retry."
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next && params.next.startsWith("/") ? params.next : "/dashboard";
  const errorMessage = params?.error ? errorMessages[params.error] : undefined;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden space-y-6 lg:block">
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            MedConnect Pro
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight text-white">
            Better patient communication starts with a better login experience.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-300">
            Access appointments, reminders, secure threads, and delivery status from one focused healthcare workspace.
          </p>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-2xl font-bold text-cyan-200">HIPAA</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Aware logs</p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-2xl font-bold text-emerald-200">Real-time</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Scheduling</p>
            </article>
            <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-2xl font-bold text-amber-200">Multi</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Channel alerts</p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_24px_80px_-35px_rgba(34,211,238,0.4)] backdrop-blur sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Secure Access</p>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Sign in</h2>
            <p className="text-sm text-slate-300">Continue to your protected dashboard workspace.</p>
          </div>
          {errorMessage ? (
            <p className="mb-4 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}
          <form action={signInWithPasswordAction} className="flex flex-col gap-4">
            <input name="next" type="hidden" value={nextPath} />
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-200">Email</span>
              <input
                autoComplete="email"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                name="email"
                placeholder="provider@example.com"
                required
                type="email"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-200">Password</span>
              <input
                autoComplete="current-password"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none"
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>
            <button
              className="mt-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              type="submit"
            >
              Access Dashboard
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

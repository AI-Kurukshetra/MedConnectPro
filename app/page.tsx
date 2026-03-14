import type { Metadata } from "next";
import Link from "next/link";
import { Manrope, Playfair_Display } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"]
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["600", "700"]
});

export const metadata: Metadata = {
  title: "MedConnect Pro | Intelligent Patient Engagement",
  description: "Coordinate appointments, reminders, and secure messaging in one clean healthcare workspace."
};

export default function HomePage() {
  return (
    <main className={`${manrope.variable} ${playfair.variable} relative isolate min-h-screen overflow-hidden bg-slate-950 text-slate-100`}>
      <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-28 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <p className="text-sm tracking-[0.2em] text-cyan-200/90">MEDCONNECT PRO</p>
          <Link
            className="rounded-full border border-slate-700 bg-slate-900/80 px-5 py-2 text-xs font-semibold tracking-wide text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
            href="/login"
          >
            Sign In
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-7">
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Hackathon MVP
            </p>
            <h1 className="max-w-2xl font-[var(--font-playfair)] text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Modern care coordination without the operational chaos.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Keep providers and patients aligned with real-time scheduling, secure threads, automated reminders, and
              traceable notifications in one dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                href="/dashboard"
              >
                Open Dashboard
              </Link>
              <Link
                className="rounded-lg border border-slate-600 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-100"
                href="/login"
              >
                Try Login
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-cyan-200">2-way</p>
                <p className="mt-1 text-sm text-slate-300">Patient and provider messaging</p>
              </article>
              <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-emerald-200">Real-time</p>
                <p className="mt-1 text-sm text-slate-300">Availability and booking checks</p>
              </article>
              <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-2xl font-bold text-amber-200">Audit-ready</p>
                <p className="mt-1 text-sm text-slate-300">Traceable notification pipeline</p>
              </article>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-[0_20px_80px_-30px_rgba(45,212,191,0.35)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Platform Snapshot</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Upcoming Appointments</p>
                <p className="mt-1 text-2xl font-bold text-white">12</p>
                <p className="text-xs text-emerald-300">+3 confirmed today</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">Pending Reminders</p>
                <p className="mt-1 text-2xl font-bold text-white">27</p>
                <p className="text-xs text-cyan-300">SMS, email, and in-app active</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">EHR Sync Queue</p>
                <p className="mt-1 text-2xl font-bold text-white">5</p>
                <p className="text-xs text-amber-300">All outbound events pending dispatch</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

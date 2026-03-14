import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | MedConnect Pro"
};

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Entry Point</p>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Choose your primary workflow</h2>
        <p className="max-w-2xl text-sm text-slate-300">
          Jump into the patient view for appointment and message history, or switch to provider operations for queue,
          schedule, and reminders.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:shadow-[0_20px_70px_-35px_rgba(34,211,238,0.6)]"
          href="/dashboard/patient"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Patient Side</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Patient Portal</h3>
          <p className="mt-2 text-sm text-slate-300">Upcoming appointments, message inbox, and reminder preferences.</p>
          <p className="mt-6 text-sm font-medium text-cyan-200 transition group-hover:text-cyan-100">Open patient view</p>
        </Link>
        <Link
          className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-[0_20px_70px_-35px_rgba(52,211,153,0.6)]"
          href="/dashboard/provider"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Provider Side</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Provider View</h3>
          <p className="mt-2 text-sm text-slate-300">Message queue, schedule timeline, and reminder delivery status.</p>
          <p className="mt-6 text-sm font-medium text-emerald-200 transition group-hover:text-emerald-100">Open provider view</p>
        </Link>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | MedConnect Pro"
};

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Workspace</h2>
        <p className="text-sm text-slate-600">Choose a dashboard view for patient-facing and provider-facing workflows.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          className="rounded-xl border bg-slate-50 p-5 transition hover:border-slate-400 hover:bg-slate-100"
          href="/dashboard/patient"
        >
          <h3 className="text-lg font-semibold">Patient Portal</h3>
          <p className="mt-2 text-sm text-slate-600">Upcoming appointments, message inbox, and reminder preferences.</p>
        </Link>
        <Link
          className="rounded-xl border bg-slate-50 p-5 transition hover:border-slate-400 hover:bg-slate-100"
          href="/dashboard/provider"
        >
          <h3 className="text-lg font-semibold">Provider View</h3>
          <p className="mt-2 text-sm text-slate-600">Message queue, schedule timeline, and reminder delivery status.</p>
        </Link>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProviderUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Provider Dashboard | MedConnect Pro"
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  patient_id: string;
};

type DeliveryRow = {
  id: string;
  channel: string;
  status: string;
  requested_at: string;
  destination: string | null;
};

type ThreadRow = {
  id: string;
  updated_at: string;
  subject: string | null;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-200 border-amber-300/35",
  delivered: "bg-emerald-400/10 text-emerald-200 border-emerald-300/35",
  failed: "bg-red-400/10 text-red-200 border-red-300/35"
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default async function ProviderDashboardPage() {
  const { user } = await requireProviderUser();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  const [appointmentsResult, queueResult, reminderStatusResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, patient_id")
      .eq("provider_user_id", user.id)
      .in("status", ["scheduled", "confirmed"])
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(8),
    supabase
      .from("message_threads")
      .select("id, updated_at, subject")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("notification_deliveries")
      .select("id, channel, status, requested_at, destination")
      .order("requested_at", { ascending: false })
      .limit(10)
  ]);

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
  const queueThreads = (queueResult.data ?? []) as ThreadRow[];
  const reminderStatuses = (reminderStatusResult.data ?? []) as DeliveryRow[];

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Provider View</p>
        <h2 className="text-2xl font-semibold text-white">Provider Dashboard</h2>
        <p className="text-sm text-slate-300">Track queue, schedule, and reminder delivery outcomes.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200">{appointments.length}</p>
          <p className="text-xs text-slate-400">Appointments</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Queue</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{queueThreads.length}</p>
          <p className="text-xs text-slate-400">Recent threads</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Deliveries</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{reminderStatuses.length}</p>
          <p className="text-xs text-slate-400">Latest reminders</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-base font-semibold text-white">Message Queue</h3>
          <ul className="mt-3 space-y-2.5">
            {queueThreads.length === 0 ? (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
                No recent conversation activity.
              </li>
            ) : (
              queueThreads.map((thread) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5" key={thread.id}>
                  <p className="text-sm font-medium text-slate-100">{thread.subject ?? "Patient conversation"}</p>
                  <p className="text-xs text-slate-400">Updated {formatDateTime(thread.updated_at)}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-base font-semibold text-white">Upcoming Schedule</h3>
          <ul className="mt-3 space-y-2.5">
            {appointments.length === 0 ? (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
                No upcoming appointments.
              </li>
            ) : (
              appointments.map((appointment) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5" key={appointment.id}>
                  <p className="text-sm font-medium text-slate-100">
                    {formatDateTime(appointment.starts_at)} - {formatDateTime(appointment.ends_at)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-cyan-200">{appointment.status}</p>
                  <p className="text-xs text-slate-400">Patient {appointment.patient_id.slice(0, 8)}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-base font-semibold text-white">Reminder Status</h3>
          <ul className="mt-3 space-y-2.5">
            {reminderStatuses.length === 0 ? (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
                No reminder delivery records.
              </li>
            ) : (
              reminderStatuses.map((delivery) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5" key={delivery.id}>
                  <p className="text-sm font-medium text-slate-100">{delivery.channel.toUpperCase()}</p>
                  <p className="mt-1">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        statusStyles[delivery.status] ?? "bg-slate-800 text-slate-200 border-slate-700"
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">Requested {formatDateTime(delivery.requested_at)}</p>
                  {delivery.destination ? <p className="text-xs text-slate-400">{delivery.destination}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

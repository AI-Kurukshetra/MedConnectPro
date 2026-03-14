import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

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
  const user = await requireUser();
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
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Provider Dashboard</h2>
        <p className="text-sm text-slate-600">Track queue, schedule, and reminder delivery outcomes.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border p-4">
          <h3 className="text-base font-semibold">Message Queue</h3>
          <ul className="mt-3 space-y-2">
            {queueThreads.length === 0 ? (
              <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No recent conversation activity.</li>
            ) : (
              queueThreads.map((thread) => (
                <li className="rounded-md border p-3" key={thread.id}>
                  <p className="text-sm font-medium">{thread.subject ?? "Patient conversation"}</p>
                  <p className="text-xs text-slate-500">Updated {formatDateTime(thread.updated_at)}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border p-4">
          <h3 className="text-base font-semibold">Upcoming Schedule</h3>
          <ul className="mt-3 space-y-2">
            {appointments.length === 0 ? (
              <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No upcoming appointments.</li>
            ) : (
              appointments.map((appointment) => (
                <li className="rounded-md border p-3" key={appointment.id}>
                  <p className="text-sm font-medium">
                    {formatDateTime(appointment.starts_at)} - {formatDateTime(appointment.ends_at)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{appointment.status}</p>
                  <p className="text-xs text-slate-500">Patient {appointment.patient_id.slice(0, 8)}</p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border p-4">
          <h3 className="text-base font-semibold">Reminder Status</h3>
          <ul className="mt-3 space-y-2">
            {reminderStatuses.length === 0 ? (
              <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No reminder delivery records.</li>
            ) : (
              reminderStatuses.map((delivery) => (
                <li className="rounded-md border p-3" key={delivery.id}>
                  <p className="text-sm font-medium">
                    {delivery.channel.toUpperCase()} - {delivery.status}
                  </p>
                  <p className="text-xs text-slate-500">Requested {formatDateTime(delivery.requested_at)}</p>
                  {delivery.destination ? <p className="text-xs text-slate-500">{delivery.destination}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

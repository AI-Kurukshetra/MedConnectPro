import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Patient Portal | MedConnect Pro"
};

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
};

type ThreadRow = {
  id: string;
  subject: string | null;
  updated_at: string;
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

export default async function PatientPortalPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", user.id).maybeSingle();

  const patientId = patient?.id;

  let appointments: AppointmentRow[] = [];
  let threads: ThreadRow[] = [];

  if (patientId) {
    const [appointmentsResult, threadsResult] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, starts_at, ends_at, status, notes")
        .eq("patient_id", patientId)
        .in("status", ["scheduled", "confirmed"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(6),
      supabase
        .from("message_threads")
        .select("id, subject, updated_at")
        .eq("patient_id", patientId)
        .order("updated_at", { ascending: false })
        .limit(6)
    ]);

    appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
    threads = (threadsResult.data ?? []) as ThreadRow[];
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Patient Portal</h2>
        <p className="text-sm text-slate-600">View upcoming visits and your recent message threads.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h3 className="text-base font-semibold">Upcoming Appointments</h3>
          <ul className="mt-3 space-y-2">
            {appointments.length === 0 ? (
              <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No upcoming appointments found.</li>
            ) : (
              appointments.map((appointment) => (
                <li className="rounded-md border p-3" key={appointment.id}>
                  <p className="text-sm font-medium">
                    {formatDateTime(appointment.starts_at)} - {formatDateTime(appointment.ends_at)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{appointment.status}</p>
                  {appointment.notes ? <p className="mt-1 text-sm text-slate-600">{appointment.notes}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border p-4">
          <h3 className="text-base font-semibold">Messages</h3>
          <ul className="mt-3 space-y-2">
            {threads.length === 0 ? (
              <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">No message threads yet.</li>
            ) : (
              threads.map((thread) => (
                <li className="rounded-md border p-3" key={thread.id}>
                  <p className="text-sm font-medium">{thread.subject ?? "Patient conversation"}</p>
                  <p className="text-xs text-slate-500">Last updated {formatDateTime(thread.updated_at)}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requirePatientUser } from "@/lib/auth/session";

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

const statusStyles: Record<string, string> = {
  scheduled: "bg-cyan-400/10 text-cyan-200 border-cyan-300/35",
  confirmed: "bg-emerald-400/10 text-emerald-200 border-emerald-300/35"
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
  const supabase = await createClient();
  const { user } = await requirePatientUser(supabase);

  let pageError: string | null = null;

  const { data: patientByProfile, error: patientByProfileError } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (patientByProfileError) {
    pageError = `Patient profile lookup failed: ${patientByProfileError.message}`;
  }

  let patientId = patientByProfile?.id ?? null;

  if (!patientId && user.email) {
    const { data: patientByEmail, error: patientByEmailError } = await supabase
      .from("patients")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (patientByEmailError) {
      pageError = pageError ?? `Patient email fallback lookup failed: ${patientByEmailError.message}`;
    } else {
      patientId = patientByEmail?.id ?? null;
    }
  }

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

    if (appointmentsResult.error) {
      pageError = pageError ?? `Appointments query failed: ${appointmentsResult.error.message}`;
    }

    if (threadsResult.error) {
      pageError = pageError ?? `Threads query failed: ${threadsResult.error.message}`;
    }

    appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
    threads = (threadsResult.data ?? []) as ThreadRow[];
  } else if (!pageError) {
    pageError = "No patient record is linked to your account yet.";
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Patient View</p>
        <h2 className="text-2xl font-semibold text-white">Patient Portal</h2>
        <p className="text-sm text-slate-300">View upcoming visits and your recent message threads.</p>
      </header>

      {pageError ? (
        <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{pageError}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Upcoming</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200">{appointments.length}</p>
          <p className="text-xs text-slate-400">Appointments</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Threads</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{threads.length}</p>
          <p className="text-xs text-slate-400">Recent conversations</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Timezone</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">UTC</p>
          <p className="text-xs text-slate-400">Demo profile setting</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-base font-semibold text-white">Upcoming Appointments</h3>
          <ul className="mt-3 space-y-2.5">
            {appointments.length === 0 ? (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
                No upcoming appointments found.
              </li>
            ) : (
              appointments.map((appointment) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5" key={appointment.id}>
                  <p className="text-sm font-medium text-slate-100">
                    {formatDateTime(appointment.starts_at)} - {formatDateTime(appointment.ends_at)}
                  </p>
                  <p className="mt-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                        statusStyles[appointment.status] ?? "bg-slate-800 text-slate-200 border-slate-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </p>
                  {appointment.notes ? <p className="mt-2 text-sm text-slate-300">{appointment.notes}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h3 className="text-base font-semibold text-white">Messages</h3>
          <ul className="mt-3 space-y-2.5">
            {threads.length === 0 ? (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-400">
                No message threads yet.
              </li>
            ) : (
              threads.map((thread) => (
                <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5" key={thread.id}>
                  <p className="text-sm font-medium text-slate-100">{thread.subject ?? "Patient conversation"}</p>
                  <p className="text-xs text-slate-400">Last updated {formatDateTime(thread.updated_at)}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

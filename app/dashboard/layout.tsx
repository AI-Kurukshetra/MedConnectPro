import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/dashboard/actions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  return (
    <AppShell
      title="Care Operations"
      subtitle={user.email ?? "Authenticated user"}
      headerAction={
        <form action={signOutAction}>
          <button
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3.5 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
            type="submit"
          >
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}

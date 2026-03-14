import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "@/app/dashboard/actions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell
      title="Dashboard"
      subtitle={user.email ?? "Authenticated user"}
      headerAction={
        <form action={signOutAction}>
          <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50" type="submit">
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}

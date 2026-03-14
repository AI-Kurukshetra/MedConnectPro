import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, headerAction, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_18px_60px_-40px_rgba(34,211,238,0.6)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
            </div>
            {headerAction ? <div>{headerAction}</div> : null}
          </div>
        </header>
        <section>{children}</section>
      </div>
    </div>
  );
}

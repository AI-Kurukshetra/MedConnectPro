import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, headerAction, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <header className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {headerAction ? <div>{headerAction}</div> : null}
      </header>
      <section>{children}</section>
    </div>
  );
}

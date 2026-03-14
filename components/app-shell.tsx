import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  children: ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <section>{children}</section>
    </div>
  );
}

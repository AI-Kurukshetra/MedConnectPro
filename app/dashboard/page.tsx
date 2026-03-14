import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | MedConnect Pro"
};

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Provider Dashboard</h1>
      <p className="text-sm text-slate-600">Dashboard modules will be added in feature tasks.</p>
    </section>
  );
}

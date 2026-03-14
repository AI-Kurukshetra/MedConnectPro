import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">MedConnect Pro</h1>
      <p className="text-sm text-slate-600">Next.js + Supabase MVP scaffold.</p>
      <div className="flex gap-3">
        <Link className="rounded-md border px-3 py-2 text-sm" href="/login">
          Login
        </Link>
        <Link className="rounded-md border px-3 py-2 text-sm" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}

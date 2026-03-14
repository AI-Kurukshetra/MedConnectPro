import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | MedConnect Pro"
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-sm text-slate-600">Authentication UI will be implemented in the next task.</p>
    </main>
  );
}

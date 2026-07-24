import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f2] px-6 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
          Student Life OS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Account creation is next
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Login is wired first. The sign-up flow will use the same Supabase
          server action pattern.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}

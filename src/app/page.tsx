import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasSupabaseConfig()) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
              Student Life OS
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Home
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as {user.email}
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Finance</p>
            <p className="mt-3 text-2xl font-semibold">£0.00</p>
            <p className="mt-2 text-sm text-slate-600">
              Account balances and monthly spending will appear here.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Career</p>
            <p className="mt-3 text-2xl font-semibold">0 applications</p>
            <p className="mt-2 text-sm text-slate-600">
              Track roles, interview stages, notes, and outcomes.
            </p>
          </div>

          <Link
            href="/productivity"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">Productivity</p>
            <p className="mt-3 text-2xl font-semibold">0 tasks</p>
            <p className="mt-2 text-sm text-slate-600">
              Open your daily task list and plan focused work.
            </p>
          </Link>

          <Link
            href="/calendar"
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">Calendar</p>
            <p className="mt-3 text-2xl font-semibold">Month view</p>
            <p className="mt-2 text-sm text-slate-600">
              Open a simple calendar outline for planning your schedule.
            </p>
          </Link>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                MVP build order
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Authentication is now the first working foundation. The next
                screens should add finance accounts, transactions, and career
                applications behind this protected home page.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Accounts", "Transactions", "Applications", "Analytics"].map(
              (item) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  key={item}
                >
                  {item}
                </div>
              ),
            )}
            <Link
              href="/productivity"
              className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
            >
              Productivity
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { ToDoList } from "@/features/productivity/components/to-do-list";
import { WeeklyStudyChart } from "@/features/productivity/components/weekly-study-chart";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductivityPage() {
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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
            >
              Student Life OS
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Productivity
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A practical command centre for daily tasks, deadlines, and focused
              study work. Tasks are stored locally for now and can be connected
              to Supabase once the schema is ready.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Home
            </Link>

            <Link
              href="/productivity/pomodoro"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Pomodoro
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-lg border border-teal-200 bg-teal-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-800">
                Focus sessions
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                Use the dedicated Pomodoro page when you are ready to study.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Keep this page for planning tasks, then switch to the timer for
                focused work blocks and breaks.
              </p>
            </div>
            <Link
              href="/productivity/pomodoro"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open timer
            </Link>
          </div>
        </section>

        <WeeklyStudyChart />

        <ToDoList />
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { StudyStreaks } from "@/features/productivity/components/study-streaks";
import { WeeklyStudyChart } from "@/features/productivity/components/weekly-study-chart";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
            >
              Student Life OS
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Study analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review weekly focused study time from completed Pomodoro sessions.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/productivity"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Tasks
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

        <div className="space-y-6">
          <StudyStreaks />
          <WeeklyStudyChart />
        </div>
      </div>
    </main>
  );
}

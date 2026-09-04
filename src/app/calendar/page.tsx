import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { CalendarMonthOutline } from "@/app/calendar/calendar-month-outline";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
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
            <Link
              href="/"
              className="text-sm font-medium text-teal-700 transition hover:text-teal-900"
            >
              Student Life OS
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Calendar
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as {user.email}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Home
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

        <CalendarMonthOutline />
      </div>
    </main>
  );
}

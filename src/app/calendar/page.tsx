import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return start;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getMonthDays() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

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

  const today = new Date();
  const monthDays = getMonthDays();

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

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-semibold tracking-tight">
              {formatMonth(today)}
            </h2>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekdays.map((weekday) => (
              <div
                className="px-3 py-3 text-center text-sm font-semibold text-slate-600"
                key={weekday}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const isCurrentMonth = day.getMonth() === today.getMonth();
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();

              return (
                <div
                  className={`min-h-28 border-b border-r border-slate-200 p-3 ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50"
                  }`}
                  key={day.toISOString()}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                      isToday
                        ? "bg-teal-700 text-white"
                        : isCurrentMonth
                          ? "text-slate-900"
                          : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

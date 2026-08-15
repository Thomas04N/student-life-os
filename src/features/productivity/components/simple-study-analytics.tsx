"use client";

import { useEffect, useMemo, useState } from "react";

import type { StudySession, Task } from "@/features/productivity/types";

const STUDY_SESSIONS_STORAGE_KEY = "student-life-os:study-sessions:v1";
const TASKS_STORAGE_KEY = "student-life-os:tasks:v1";
const WEEK_DAY_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "long",
});
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
});

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function formatStudyDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function parseStoredStudySessions(storedSessions: string | null) {
  if (!storedSessions) {
    return [];
  }

  try {
    const parsedSessions = JSON.parse(storedSessions);

    if (!Array.isArray(parsedSessions)) {
      return [];
    }

    return parsedSessions.filter(
      (session): session is StudySession =>
        typeof session === "object" &&
        session !== null &&
        typeof session.id === "string" &&
        typeof session.completedAt === "string" &&
        typeof session.dateKey === "string" &&
        typeof session.focusedSeconds === "number",
    );
  } catch {
    return [];
  }
}

function parseStoredTasks(storedTasks: string | null) {
  if (!storedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(storedTasks);

    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks.filter(
      (task): task is Task =>
        typeof task === "object" &&
        task !== null &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        (task.status === "todo" || task.status === "done"),
    );
  } catch {
    return [];
  }
}

export function SimpleStudyAnalytics() {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    function loadAnalyticsData() {
      setStudySessions(
        parseStoredStudySessions(
          window.localStorage.getItem(STUDY_SESSIONS_STORAGE_KEY),
        ),
      );
      setTasks(
        parseStoredTasks(window.localStorage.getItem(TASKS_STORAGE_KEY)),
      );
      setHasLoaded(true);
    }

    loadAnalyticsData();
    window.addEventListener("storage", loadAnalyticsData);
    window.addEventListener("focus", loadAnalyticsData);

    return () => {
      window.removeEventListener("storage", loadAnalyticsData);
      window.removeEventListener("focus", loadAnalyticsData);
    };
  }, []);

  const analytics = useMemo(() => {
    const today = startOfToday();
    const weekStartKey = dateKey(addDays(today, -6));
    const todayKey = dateKey(today);
    const weeklySessions = studySessions.filter(
      (session) =>
        session.dateKey >= weekStartKey && session.dateKey <= todayKey,
    );
    const weeklyFocusedSeconds = weeklySessions.reduce(
      (total, session) => total + session.focusedSeconds,
      0,
    );
    const completedTasks = tasks.filter(
      (task) => task.status === "done",
    ).length;
    const completionRate =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const dayTotals = studySessions.reduce<Record<string, number>>(
      (totals, session) => ({
        ...totals,
        [session.dateKey]:
          (totals[session.dateKey] ?? 0) + session.focusedSeconds,
      }),
      {},
    );
    const bestStudyDays = Object.entries(dayTotals)
      .map(([key, focusedSeconds]) => ({
        focusedSeconds,
        key,
      }))
      .sort((firstDay, secondDay) => {
        if (secondDay.focusedSeconds !== firstDay.focusedSeconds) {
          return secondDay.focusedSeconds - firstDay.focusedSeconds;
        }

        return secondDay.key.localeCompare(firstDay.key);
      })
      .slice(0, 3);

    return {
      bestStudyDays,
      completedTasks,
      completionRate,
      openTasks: tasks.length - completedTasks,
      taskCount: tasks.length,
      weeklyFocusedSeconds,
      weeklySessions: weeklySessions.length,
    };
  }, [studySessions, tasks]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Simple analytics</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Weekly study and task progress
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A quick read on your strongest study days, weekly focus time, and
            task completion rate.
          </p>
        </div>

        <div className="grid gap-3 sm:min-w-[460px] sm:grid-cols-3">
          <AnalyticsStat
            label="Weekly hours"
            value={formatStudyDuration(analytics.weeklyFocusedSeconds)}
            detail={`${analytics.weeklySessions} focus ${
              analytics.weeklySessions === 1 ? "session" : "sessions"
            }`}
          />
          <AnalyticsStat
            label="Completion"
            value={`${analytics.completionRate}%`}
            detail={`${analytics.completedTasks}/${analytics.taskCount} tasks done`}
          />
          <AnalyticsStat
            label="Open tasks"
            value={String(analytics.openTasks)}
            detail="Across all categories"
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Best study days
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Ranked by total completed Pomodoro focus time.
            </p>
          </div>

          <div className="grid gap-2 sm:min-w-[420px]">
            {hasLoaded && analytics.bestStudyDays.length > 0 ? (
              analytics.bestStudyDays.map((day, index) => {
                const date = dateFromKey(day.key);

                return (
                  <div
                    key={day.key}
                    className="grid gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="text-sm font-semibold text-teal-700">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {WEEK_DAY_FORMATTER.format(date)},{" "}
                      {SHORT_DATE_FORMATTER.format(date)}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {formatStudyDuration(day.focusedSeconds)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                Complete a focus session to see your strongest study days.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsStat({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

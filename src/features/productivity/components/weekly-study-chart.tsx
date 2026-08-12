"use client";

import { useEffect, useMemo, useState } from "react";

import type { StudySession } from "@/features/productivity/types";

const STORAGE_KEY = "student-life-os:study-sessions:v1";
const WEEK_DAY_FORMATTER = new Intl.DateTimeFormat("en", {
  weekday: "short",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

export function WeeklyStudyChart() {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    function loadSessions() {
      setStudySessions(
        parseStoredStudySessions(window.localStorage.getItem(STORAGE_KEY)),
      );
      setHasLoaded(true);
    }

    loadSessions();
    window.addEventListener("storage", loadSessions);
    window.addEventListener("focus", loadSessions);

    return () => {
      window.removeEventListener("storage", loadSessions);
      window.removeEventListener("focus", loadSessions);
    };
  }, []);

  const weeklyData = useMemo(() => {
    const today = startOfToday();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      const key = dateKey(date);
      const sessions = studySessions.filter(
        (session) => session.dateKey === key,
      );
      const focusedSeconds = sessions.reduce(
        (total, session) => total + session.focusedSeconds,
        0,
      );

      return {
        date,
        focusedSeconds,
        key,
        label: WEEK_DAY_FORMATTER.format(date),
        sessions: sessions.length,
      };
    });
    const totalFocusedSeconds = days.reduce(
      (total, day) => total + day.focusedSeconds,
      0,
    );
    const bestDay = days.reduce(
      (best, day) => (day.focusedSeconds > best.focusedSeconds ? day : best),
      days[0],
    );

    return {
      averageFocusedSeconds: Math.round(totalFocusedSeconds / days.length),
      bestDay,
      days,
      maxFocusedSeconds: Math.max(1, ...days.map((day) => day.focusedSeconds)),
      totalFocusedSeconds,
      totalSessions: days.reduce((total, day) => total + day.sessions, 0),
    };
  }, [studySessions]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Weekly study chart
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            Last 7 days of focused study
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Completed Pomodoro focus sessions appear here after you finish a
            study block.
          </p>
        </div>

        <div className="grid gap-3 sm:min-w-[420px] sm:grid-cols-3">
          <StudyChartStat
            label="This week"
            value={formatStudyDuration(weeklyData.totalFocusedSeconds)}
          />
          <StudyChartStat
            label="Sessions"
            value={String(weeklyData.totalSessions)}
          />
          <StudyChartStat
            label="Daily avg"
            value={formatStudyDuration(weeklyData.averageFocusedSeconds)}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-7">
        {weeklyData.days.map((day) => {
          const height = Math.max(
            day.focusedSeconds > 0 ? 12 : 4,
            Math.round(
              (day.focusedSeconds / weeklyData.maxFocusedSeconds) * 128,
            ),
          );
          const isToday = day.key === dateKey(startOfToday());

          return (
            <div
              key={day.key}
              className={`rounded-lg border p-3 ${
                isToday
                  ? "border-teal-200 bg-teal-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-end justify-between gap-3 sm:h-40 sm:flex-col sm:items-stretch">
                <div className="min-w-20 sm:min-w-0">
                  <p className="text-sm font-semibold text-slate-950">
                    {day.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {DATE_FORMATTER.format(day.date)}
                  </p>
                </div>

                <div className="flex flex-1 items-end justify-end sm:h-32 sm:justify-center">
                  <div
                    className={`w-full min-w-20 rounded-md sm:min-w-0 ${
                      day.focusedSeconds > 0 ? "bg-teal-700" : "bg-slate-300"
                    }`}
                    style={{
                      height: `${height}px`,
                      maxWidth: "44px",
                    }}
                    aria-label={`${day.label}: ${formatStudyDuration(
                      day.focusedSeconds,
                    )} studied`}
                    role="img"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-700">
                  {formatStudyDuration(day.focusedSeconds)}
                </span>
                <span className="text-slate-500">
                  {day.sessions} {day.sessions === 1 ? "session" : "sessions"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {hasLoaded && weeklyData.totalFocusedSeconds > 0 ? (
          <p>
            Best day:{" "}
            <span className="font-medium text-slate-900">
              {weeklyData.bestDay.label},{" "}
              {DATE_FORMATTER.format(weeklyData.bestDay.date)}
            </span>{" "}
            with {formatStudyDuration(weeklyData.bestDay.focusedSeconds)}.
          </p>
        ) : (
          <p>Finish a Pomodoro focus session to start building your chart.</p>
        )}
      </div>
    </section>
  );
}

function StudyChartStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950 tabular-nums">
        {value}
      </p>
    </div>
  );
}

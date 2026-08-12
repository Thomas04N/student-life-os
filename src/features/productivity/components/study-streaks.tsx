"use client";

import { useEffect, useMemo, useState } from "react";

import type { StudySession } from "@/features/productivity/types";

const STORAGE_KEY = "student-life-os:study-sessions:v1";
const RECENT_DAYS = 14;
const CONSISTENCY_DAYS = 30;
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

function dayDifference(startKey: string, endKey: string) {
  const start = dateFromKey(startKey);
  const end = dateFromKey(endKey);

  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
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

function getLongestStreak(studyDays: string[]) {
  if (studyDays.length === 0) {
    return 0;
  }

  let longestStreak = 1;
  let currentStreak = 1;

  for (let index = 1; index < studyDays.length; index += 1) {
    const previousDay = studyDays[index - 1];
    const currentDay = studyDays[index];

    if (dayDifference(previousDay, currentDay) === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return longestStreak;
}

function getCurrentStreak(studyDaySet: Set<string>) {
  let streak = 0;
  let cursor = startOfToday();

  while (studyDaySet.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function getNextMilestone(currentStreak: number) {
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(
    (milestone) => milestone > currentStreak,
  );

  return nextMilestone ?? currentStreak + 50;
}

export function StudyStreaks() {
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

  const streakData = useMemo(() => {
    const today = startOfToday();
    const studyDaySet = new Set(
      studySessions
        .filter((session) => session.focusedSeconds > 0)
        .map((session) => session.dateKey),
    );
    const studyDays = [...studyDaySet].sort();
    const currentStreak = getCurrentStreak(studyDaySet);
    const longestStreak = getLongestStreak(studyDays);
    const recentDays = Array.from({ length: RECENT_DAYS }, (_, index) => {
      const date = addDays(today, index - (RECENT_DAYS - 1));
      const key = dateKey(date);
      const sessions = studySessions.filter(
        (session) => session.dateKey === key,
      );

      return {
        date,
        focusedSeconds: sessions.reduce(
          (total, session) => total + session.focusedSeconds,
          0,
        ),
        hasStudied: studyDaySet.has(key),
        key,
        label: WEEK_DAY_FORMATTER.format(date),
        sessions: sessions.length,
      };
    });
    const consistencyStart = dateKey(addDays(today, -(CONSISTENCY_DAYS - 1)));
    const studiedDaysLastMonth = studyDays.filter(
      (studyDay) => studyDay >= consistencyStart && studyDay <= dateKey(today),
    ).length;
    const nextMilestone = getNextMilestone(currentStreak);

    return {
      currentStreak,
      daysUntilMilestone: nextMilestone - currentStreak,
      longestStreak,
      nextMilestone,
      recentDays,
      studiedDaysLastMonth,
    };
  }, [studySessions]);

  const hasStudiedToday = streakData.currentStreak > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-700">Study streaks</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
            {hasStudiedToday
              ? `${streakData.currentStreak} day current streak`
              : "No active streak today"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            A study day counts when you complete at least one Pomodoro focus
            session.
          </p>
        </div>

        <div className="grid gap-3 sm:min-w-[460px] sm:grid-cols-3">
          <StreakStat label="Current" value={`${streakData.currentStreak}d`} />
          <StreakStat label="Longest" value={`${streakData.longestStreak}d`} />
          <StreakStat
            label="Last 30 days"
            value={`${streakData.studiedDaysLastMonth}/${CONSISTENCY_DAYS}`}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
        {streakData.recentDays.map((day) => {
          const isToday = day.key === dateKey(startOfToday());

          return (
            <div
              key={day.key}
              className={`min-h-20 rounded-lg border p-2 ${
                day.hasStudied
                  ? "border-teal-200 bg-teal-50"
                  : "border-slate-200 bg-slate-50"
              } ${isToday ? "ring-2 ring-teal-700 ring-offset-2" : ""}`}
              title={`${day.label}, ${DATE_FORMATTER.format(day.date)}: ${
                day.sessions
              } ${day.sessions === 1 ? "session" : "sessions"}`}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  day.hasStudied ? "bg-teal-700" : "bg-slate-300"
                }`}
                aria-label={`${day.label}, ${DATE_FORMATTER.format(day.date)} ${
                  day.hasStudied ? "studied" : "not studied"
                }`}
                role="img"
              />
              <p className="mt-3 text-xs font-semibold text-slate-800">
                {day.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {DATE_FORMATTER.format(day.date)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {hasLoaded && hasStudiedToday ? (
          <p>
            {streakData.daysUntilMilestone}{" "}
            {streakData.daysUntilMilestone === 1 ? "day" : "days"} to a{" "}
            <span className="font-medium text-slate-900">
              {streakData.nextMilestone} day streak
            </span>
            .
          </p>
        ) : (
          <p>Complete one focus session today to start a new streak.</p>
        )}
      </div>
    </section>
  );
}

function StreakStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950 tabular-nums">
        {value}
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { StudySession } from "@/features/productivity/types";

type TimerMode = "focus" | "shortBreak" | "longBreak";

type TimerConfig = {
  focus: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
};

const timerConfig: TimerConfig = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  longBreakInterval: 4,
};

const STORAGE_KEY = "student-life-os:study-sessions:v1";
const DAILY_GOAL_STORAGE_KEY = "student-life-os:daily-study-goal:v1";
const DEFAULT_DAILY_GOAL_SECONDS = 30 * 60;
const MIN_DAILY_GOAL_SECONDS = 5 * 60;
const MAX_DAILY_GOAL_SECONDS = 8 * 60 * 60;

const modeLabels: Record<TimerMode, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};
const SESSION_COMPLETED_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
});

const timerRing = {
  circumference: 2 * Math.PI * 142,
  radius: 142,
  size: 340,
  strokeWidth: 16,
};

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
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

function formatSessionCompletedAt(completedAt: string) {
  return SESSION_COMPLETED_FORMATTER.format(new Date(completedAt));
}

function clampDailyGoal(totalSeconds: number) {
  return Math.min(
    MAX_DAILY_GOAL_SECONDS,
    Math.max(MIN_DAILY_GOAL_SECONDS, totalSeconds),
  );
}

function getModeDuration(mode: TimerMode) {
  return timerConfig[mode];
}

function getNextMode(currentMode: TimerMode, completedFocusSessions: number) {
  if (currentMode !== "focus") {
    return "focus";
  }

  return completedFocusSessions % timerConfig.longBreakInterval === 0
    ? "longBreak"
    : "shortBreak";
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
        typeof session.focusedSeconds === "number" &&
        (session.notes === undefined || typeof session.notes === "string"),
    );
  } catch {
    return [];
  }
}

function createStudySession(): StudySession {
  const completedAt = new Date();

  return {
    id: crypto.randomUUID(),
    completedAt: completedAt.toISOString(),
    dateKey: todayKey(),
    focusedSeconds: timerConfig.focus,
    notes: "",
  };
}

function parseStoredDailyGoal(storedGoal: string | null) {
  if (!storedGoal) {
    return DEFAULT_DAILY_GOAL_SECONDS;
  }

  const parsedGoal = Number(storedGoal);

  if (!Number.isFinite(parsedGoal)) {
    return DEFAULT_DAILY_GOAL_SECONDS;
  }

  return clampDailyGoal(parsedGoal);
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsRemaining, setSecondsRemaining] = useState(timerConfig.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [hasLoadedStudySessions, setHasLoadedStudySessions] = useState(false);
  const [dailyGoalSeconds, setDailyGoalSeconds] = useState(
    DEFAULT_DAILY_GOAL_SECONDS,
  );
  const [hasLoadedDailyGoal, setHasLoadedDailyGoal] = useState(false);

  const progress = useMemo(() => {
    const duration = getModeDuration(mode);

    return Math.round(((duration - secondsRemaining) / duration) * 100);
  }, [mode, secondsRemaining]);

  const remainingProgress = useMemo(() => {
    const duration = getModeDuration(mode);

    return secondsRemaining / duration;
  }, [mode, secondsRemaining]);

  const ringOffset =
    timerRing.circumference * (1 - Math.max(0, Math.min(1, remainingProgress)));

  const studyStats = useMemo(() => {
    const today = todayKey();
    const todaysSessions = studySessions.filter(
      (session) => session.dateKey === today,
    );
    const totalFocusedSeconds = studySessions.reduce(
      (total, session) => total + session.focusedSeconds,
      0,
    );
    const todayFocusedSeconds = todaysSessions.reduce(
      (total, session) => total + session.focusedSeconds,
      0,
    );

    return {
      allTimeSessions: studySessions.length,
      todayFocusedSeconds,
      todaySessions: todaysSessions.length,
      totalFocusedSeconds,
    };
  }, [studySessions]);

  const dailyGoalProgress = Math.min(
    100,
    Math.round(
      (studyStats.todayFocusedSeconds / Math.max(1, dailyGoalSeconds)) * 100,
    ),
  );

  const latestStudySession = studySessions.at(-1);
  const recentSessionNotes = studySessions
    .filter((session) => session.notes?.trim())
    .slice()
    .reverse()
    .slice(0, 4);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedSessions = window.localStorage.getItem(STORAGE_KEY);

      setStudySessions(parseStoredStudySessions(storedSessions));
      setHasLoadedStudySessions(true);
    });
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedGoal = window.localStorage.getItem(DAILY_GOAL_STORAGE_KEY);

      setDailyGoalSeconds(parseStoredDailyGoal(storedGoal));
      setHasLoadedDailyGoal(true);
    });
  }, []);

  useEffect(() => {
    if (hasLoadedStudySessions) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studySessions));
    }
  }, [hasLoadedStudySessions, studySessions]);

  useEffect(() => {
    if (hasLoadedDailyGoal) {
      window.localStorage.setItem(
        DAILY_GOAL_STORAGE_KEY,
        String(dailyGoalSeconds),
      );
    }
  }, [dailyGoalSeconds, hasLoadedDailyGoal]);

  const completeSession = useCallback(() => {
    setIsRunning(false);

    if (mode === "focus") {
      setStudySessions((currentSessions) => [
        ...currentSessions,
        createStudySession(),
      ]);

      setCompletedFocusSessions((currentSessions) => {
        const nextSessions = currentSessions + 1;
        const nextMode = getNextMode(mode, nextSessions);

        setMode(nextMode);
        setSecondsRemaining(getModeDuration(nextMode));

        return nextSessions;
      });

      return;
    }

    setMode("focus");
    setSecondsRemaining(timerConfig.focus);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((currentSeconds) => {
        if (currentSeconds > 1) {
          return currentSeconds - 1;
        }

        window.setTimeout(completeSession, 0);

        return 0;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [completeSession, isRunning]);

  function changeMode(nextMode: TimerMode) {
    setMode(nextMode);
    setSecondsRemaining(getModeDuration(nextMode));
    setIsRunning(false);
  }

  function resetTimer() {
    setSecondsRemaining(getModeDuration(mode));
    setIsRunning(false);
  }

  function clearSessions() {
    setCompletedFocusSessions(0);
    setStudySessions([]);
  }

  function updateSessionNotes(sessionId: string, notes: string) {
    setStudySessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId ? { ...session, notes } : session,
      ),
    );
  }

  function adjustDailyGoal(deltaSeconds: number) {
    setDailyGoalSeconds((currentGoal) =>
      clampDailyGoal(currentGoal + deltaSeconds),
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <div>
          <p className="text-sm font-medium text-teal-700">Pomodoro timer</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {modeLabels[mode]}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Run focused study blocks, pause before each break, and keep a simple
            count of completed focus sessions.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-sm font-medium text-slate-500">Today studied</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatStudyDuration(studyStats.todayFocusedSeconds)}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-sm font-medium text-slate-500">Today sessions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {studyStats.todaySessions}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-sm font-medium text-slate-500">Timer cycle</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {completedFocusSessions}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total studied</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatStudyDuration(studyStats.totalFocusedSeconds)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {studyStats.allTimeSessions} focus sessions
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl rounded-lg border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Daily study goal
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              {formatStudyDuration(studyStats.todayFocusedSeconds)} /{" "}
              {formatStudyDuration(dailyGoalSeconds)}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {dailyGoalProgress}% complete today
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:w-auto">
            {(
              [
                [-15 * 60, "-15m"],
                [-5 * 60, "-5m"],
                [5 * 60, "+5m"],
                [15 * 60, "+15m"],
              ] as const
            ).map(([deltaSeconds, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => adjustDailyGoal(deltaSeconds)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Daily study goal progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={dailyGoalProgress}
        >
          <div
            className="h-full rounded-full bg-teal-700 transition-[width] duration-300"
            style={{ width: `${dailyGoalProgress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-8">
        <div className="w-full rounded-lg border border-slate-200 bg-[#f7f7f2] p-6 text-center sm:p-8">
          <div
            className="relative mx-auto grid place-items-center"
            style={{
              height: `min(${timerRing.size}px, 72vw)`,
              width: `min(${timerRing.size}px, 72vw)`,
            }}
          >
            <svg
              className="-rotate-90"
              height={timerRing.size}
              role="img"
              viewBox={`0 0 ${timerRing.size} ${timerRing.size}`}
              width={timerRing.size}
              aria-label={`${modeLabels[mode]} timer ${formatTime(
                secondsRemaining,
              )} remaining`}
            >
              <circle
                cx={timerRing.size / 2}
                cy={timerRing.size / 2}
                fill="none"
                r={timerRing.radius}
                stroke="#e2e8f0"
                strokeWidth={timerRing.strokeWidth}
              />
              <circle
                cx={timerRing.size / 2}
                cy={timerRing.size / 2}
                fill="none"
                r={timerRing.radius}
                stroke="#0f766e"
                strokeDasharray={timerRing.circumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                strokeWidth={timerRing.strokeWidth}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight text-slate-950 sm:text-7xl">
                {formatTime(secondsRemaining)}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {progress}% elapsed
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            {isRunning ? "Timer running" : "Timer paused"}
          </p>
        </div>

        <div className="w-full rounded-lg border border-slate-200 bg-white p-5 text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-700">
                Focus session notes
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                {latestStudySession
                  ? "Add a quick note to your latest session"
                  : "Complete a focus session to add notes"}
              </h3>
            </div>

            {latestStudySession ? (
              <p className="text-sm text-slate-500">
                {formatSessionCompletedAt(latestStudySession.completedAt)}
              </p>
            ) : null}
          </div>

          {latestStudySession ? (
            <label className="mt-4 block">
              <span className="sr-only">Latest focus session notes</span>
              <textarea
                value={latestStudySession.notes ?? ""}
                onChange={(event) =>
                  updateSessionNotes(latestStudySession.id, event.target.value)
                }
                placeholder="Jot down what you covered, what felt hard, or what to pick up next."
                className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-700/20"
              />
            </label>
          ) : (
            <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Your next completed focus block will appear here with space for a
              short reflection.
            </p>
          )}

          {recentSessionNotes.length > 0 ? (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700">
                Recent notes
              </p>
              <div className="mt-3 space-y-3">
                {recentSessionNotes.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {formatSessionCompletedAt(session.completedAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                      {session.notes}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["focus", "Focus"],
                ["shortBreak", "Short break"],
                ["longBreak", "Long break"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeMode(value)}
                className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
                  mode === value
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setIsRunning(true)}
              disabled={isRunning}
              className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
              className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={clearSessions}
              className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Clear stats
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

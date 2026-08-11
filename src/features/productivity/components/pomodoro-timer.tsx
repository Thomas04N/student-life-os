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

const modeLabels: Record<TimerMode, string> = {
  focus: "Focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

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
        typeof session.focusedSeconds === "number",
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
  };
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsRemaining, setSecondsRemaining] = useState(timerConfig.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [hasLoadedStudySessions, setHasLoadedStudySessions] = useState(false);

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

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedSessions = window.localStorage.getItem(STORAGE_KEY);

      setStudySessions(parseStoredStudySessions(storedSessions));
      setHasLoadedStudySessions(true);
    });
  }, []);

  useEffect(() => {
    if (hasLoadedStudySessions) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studySessions));
    }
  }, [hasLoadedStudySessions, studySessions]);

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

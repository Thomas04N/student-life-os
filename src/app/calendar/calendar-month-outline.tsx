"use client";

import { useMemo, useState } from "react";

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

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthDays(anchorDate: Date) {
  const monthStart = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
    1,
  );
  const gridStart = startOfWeek(monthStart);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getDate() === secondDate.getDate() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getFullYear() === secondDate.getFullYear()
  );
}

export function CalendarMonthOutline() {
  const [anchorDate, setAnchorDate] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => getMonthDays(anchorDate), [anchorDate]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {formatMonth(anchorDate)}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setAnchorDate((currentDate) => addMonths(currentDate, -1))
            }
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              const currentDate = new Date();
              setAnchorDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
              );
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() =>
              setAnchorDate((currentDate) => addMonths(currentDate, 1))
            }
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
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
          const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
          const isToday = isSameDay(day, today);

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
  );
}

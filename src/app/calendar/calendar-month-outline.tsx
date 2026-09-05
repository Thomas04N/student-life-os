"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const storageKey = "student-life-os:calendar-events:v1";
const categories = ["University", "Career", "Personal", "Admin", "Study"] as const;

type CalendarCategory = (typeof categories)[number];

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  category: CalendarCategory;
  createdAt: string;
};

type DraftEvent = {
  title: string;
  date: string;
  category: CalendarCategory;
};

const categoryClasses: Record<CalendarCategory, string> = {
  Admin: "border-amber-200 bg-amber-50 text-amber-800",
  Career: "border-sky-200 bg-sky-50 text-sky-800",
  Personal: "border-rose-200 bg-rose-50 text-rose-800",
  Study: "border-violet-200 bg-violet-50 text-violet-800",
  University: "border-teal-200 bg-teal-50 text-teal-800",
};

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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function parseStoredEvents(storedEvents: string | null) {
  if (!storedEvents) {
    return [];
  }

  try {
    const parsedEvents = JSON.parse(storedEvents);

    if (!Array.isArray(parsedEvents)) {
      return [];
    }

    return parsedEvents.filter(isCalendarEvent);
  } catch {
    return [];
  }
}

function isCalendarEvent(event: unknown): event is CalendarEvent {
  if (typeof event !== "object" || event === null) {
    return false;
  }

  const candidate = event as CalendarEvent;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.date === "string" &&
    categories.includes(candidate.category) &&
    typeof candidate.createdAt === "string"
  );
}

export function CalendarMonthOutline() {
  const [anchorDate, setAnchorDate] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draft, setDraft] = useState<DraftEvent>(() => ({
    category: "University",
    date: toDateKey(new Date()),
    title: "",
  }));
  const [hasLoaded, setHasLoaded] = useState(false);

  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => getMonthDays(anchorDate), [anchorDate]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setEvents(parseStoredEvents(window.localStorage.getItem(storageKey)));
      setHasLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(events));
    }
  }, [events, hasLoaded]);

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim() || !draft.date) {
      return;
    }

    const now = new Date().toISOString();

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        date: draft.date,
        category: draft.category,
        createdAt: now,
      },
    ]);
    setAnchorDate(new Date(`${draft.date}T00:00:00`));
    setDraft((currentDraft) => ({
      ...currentDraft,
      title: "",
    }));
  }

  function deleteEvent(eventId: string) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  }

  function eventsForDay(day: Date) {
    const dayKey = toDateKey(day);

    return events
      .filter((event) => event.date === dayKey)
      .sort((firstEvent, secondEvent) =>
        firstEvent.createdAt.localeCompare(secondEvent.createdAt),
      );
  }

  return (
    <section className="space-y-4">
      <form
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_170px_170px_auto]"
        onSubmit={addEvent}
      >
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              title: event.target.value,
            }))
          }
          placeholder="Add a calendar event"
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        />

        <input
          type="date"
          value={draft.date}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              date: event.target.value,
            }))
          }
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        />

        <select
          value={draft.category}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              category: event.target.value as CalendarCategory,
            }))
          }
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
          const dayEvents = eventsForDay(day);

          return (
            <div
              className={`min-h-32 border-b border-r border-slate-200 p-3 ${
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

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs font-medium ${categoryClasses[event.category]}`}
                    key={event.id}
                  >
                    <span className="truncate">{event.title}</span>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="shrink-0 text-slate-500 transition hover:text-red-700"
                      aria-label={`Delete ${event.title}`}
                    >
                      x
                    </button>
                  </div>
                ))}
                {dayEvents.length > 3 ? (
                  <p className="text-xs font-medium text-slate-500">
                    +{dayEvents.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}

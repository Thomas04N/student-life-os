"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type {
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "@/features/productivity/types";

const STORAGE_KEY = "student-life-os:tasks:v1";

const categories: TaskCategory[] = [
  "University",
  "Career",
  "Finance",
  "Personal",
];

const priorities: TaskPriority[] = ["low", "medium", "high"];

type ScopeFilter = "active" | "today" | "upcoming" | "completed" | "all";

type DraftTask = {
  title: string;
  notes: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
};

const initialDraft: DraftTask = {
  title: "",
  notes: "",
  category: "University",
  priority: "medium",
  dueDate: "",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function isWithinNextWeek(dueDate: string) {
  if (!dueDate) {
    return false;
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date(`${todayKey()}T00:00:00`);
  const nextWeek = addDays(today, 7);

  return due > today && due <= nextWeek;
}

function isOverdue(task: Task) {
  return Boolean(
    task.dueDate && task.status === "todo" && task.dueDate < todayKey(),
  );
}

function priorityClasses(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-teal-200 bg-teal-50 text-teal-700";
  }
}

function createTask(draft: DraftTask): Task {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    notes: draft.notes.trim(),
    category: draft.category,
    priority: draft.priority,
    status: "todo",
    dueDate: draft.dueDate,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

function parseStoredTasks(storedTasks: string | null) {
  if (!storedTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(storedTasks);

    return Array.isArray(parsedTasks) ? (parsedTasks as Task[]) : [];
  } catch {
    return [];
  }
}

function sortTasks(tasks: Task[]) {
  const priorityWeight: Record<TaskPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "todo" ? -1 : 1;
    }

    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate && !b.dueDate) {
      return -1;
    }

    if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });
}

export function ToDoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState<DraftTask>(initialDraft);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [scope, setScope] = useState<ScopeFilter>("active");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">(
    "all",
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedTasks = window.localStorage.getItem(STORAGE_KEY);

      setTasks(parseStoredTasks(storedTasks));
      setHasLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [hasLoaded, tasks]);

  const filteredTasks = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return sortTasks(tasks).filter((task) => {
      const matchesQuery =
        !normalisedQuery ||
        task.title.toLowerCase().includes(normalisedQuery) ||
        task.notes.toLowerCase().includes(normalisedQuery);
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;
      const matchesScope =
        scope === "all" ||
        (scope === "active" && task.status === "todo") ||
        (scope === "completed" && task.status === "done") ||
        (scope === "today" &&
          task.status === "todo" &&
          task.dueDate === todayKey()) ||
        (scope === "upcoming" &&
          task.status === "todo" &&
          isWithinNextWeek(task.dueDate));

      return (
        matchesQuery && matchesPriority && matchesCategory && matchesScope
      );
    });
  }, [categoryFilter, priorityFilter, query, scope, tasks]);

  const stats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status === "todo");
    const completedTasks = tasks.filter((task) => task.status === "done");

    return {
      completed: completedTasks.length,
      dueToday: openTasks.filter((task) => task.dueDate === todayKey()).length,
      highPriority: openTasks.filter((task) => task.priority === "high").length,
      open: openTasks.length,
      overdue: openTasks.filter(isOverdue).length,
    };
  }, [tasks]);

  function resetForm() {
    setDraft(initialDraft);
    setEditingTaskId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title: draft.title.trim(),
                notes: draft.notes.trim(),
                category: draft.category,
                priority: draft.priority,
                dueDate: draft.dueDate,
                updatedAt: new Date().toISOString(),
              }
            : task,
        ),
      );
    } else {
      setTasks((currentTasks) => [createTask(draft), ...currentTasks]);
    }

    resetForm();
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";

        return {
          ...task,
          status: nextStatus,
          completedAt: nextStatus === "done" ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setDraft({
      title: task.title,
      notes: task.notes,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open" value={stats.open} />
          <StatCard label="Due today" value={stats.dueToday} />
          <StatCard label="Overdue" value={stats.overdue} tone="danger" />
          <StatCard label="High priority" value={stats.highPriority} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks or notes"
              className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as TaskPriority | "all")
              }
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as TaskCategory | "all")
              }
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["active", "Active"],
              ["today", "Today"],
              ["upcoming", "Next 7 days"],
              ["completed", "Completed"],
              ["all", "All"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setScope(value as ScopeFilter)}
                className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
                  scope === value
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <article
                key={task.id}
                className={`rounded-lg border bg-white p-4 shadow-sm transition ${
                  task.status === "done"
                    ? "border-slate-200 opacity-70"
                    : isOverdue(task)
                      ? "border-red-200"
                      : "border-slate-200"
                }`}
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "done"}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 accent-teal-700"
                    aria-label={`Mark ${task.title} as ${
                      task.status === "done" ? "incomplete" : "complete"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2
                          className={`text-base font-semibold ${
                            task.status === "done"
                              ? "text-slate-500 line-through"
                              : "text-slate-950"
                          }`}
                        >
                          {task.title}
                        </h2>
                        {task.notes ? (
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {task.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="h-8 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="h-8 rounded-md border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                        {task.category}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${priorityClasses(
                          task.priority,
                        )}`}
                      >
                        {task.priority} priority
                      </span>
                      {task.dueDate ? (
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            isOverdue(task)
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          Due {task.dueDate}
                        </span>
                      ) : (
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                          No due date
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No tasks match this view
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a task or adjust the filters to bring work back into focus.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-lg font-semibold tracking-tight">
          {editingTaskId ? "Edit task" : "Add task"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Capture the task, give it a category, then decide whether it belongs
          today or later.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="title">
              Task
            </label>
            <input
              id="title"
              value={draft.title}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  title: event.target.value,
                }))
              }
              placeholder="Read distributed systems paper"
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              value={draft.notes}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  notes: event.target.value,
                }))
              }
              rows={4}
              placeholder="Add context, links, or next action"
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="category"
              >
                Category
              </label>
              <select
                id="category"
                value={draft.category}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    category: event.target.value as TaskCategory,
                  }))
                }
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-slate-800"
                htmlFor="priority"
              >
                Priority
              </label>
              <select
                id="priority"
                value={draft.priority}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    priority: event.target.value as TaskPriority,
                  }))
                }
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="dueDate">
              Due date
            </label>
            <input
              id="dueDate"
              type="date"
              value={draft.dueDate}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  dueDate: event.target.value,
                }))
              }
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 flex-1 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
            >
              {editingTaskId ? "Save task" : "Add task"}
            </button>
            {editingTaskId ? (
              <button
                type="button"
                onClick={resetForm}
                className="h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Daily operating rhythm
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>1. Add everything quickly.</li>
            <li>2. Mark only today’s important work as high priority.</li>
            <li>3. Close completed tasks before ending the day.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          tone === "danger" && value > 0 ? "text-red-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

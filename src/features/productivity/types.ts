export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "done";

export type TaskCategory = "University" | "Career" | "Finance" | "Personal";

export type Task = {
  id: string;
  title: string;
  notes: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type StudySession = {
  id: string;
  completedAt: string;
  dateKey: string;
  focusedSeconds: number;
};

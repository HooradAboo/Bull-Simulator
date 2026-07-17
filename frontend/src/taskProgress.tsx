import { createContext, useContext, useState, type ReactNode } from "react";
import type { ActionType } from "./types";

interface TaskProgress {
  processedCount: number;
  totalEmails: number;
  usedActions: Set<ActionType>;
  attachmentOpened: boolean;
}

interface TaskProgressApi extends TaskProgress {
  reportProgress: (progress: TaskProgress) => void;
}

const DEFAULT_PROGRESS: TaskProgress = {
  processedCount: 0,
  totalEmails: 0,
  usedActions: new Set(),
  attachmentOpened: false,
};

const TaskProgressContext = createContext<TaskProgressApi | null>(null);

export function TaskProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<TaskProgress>(DEFAULT_PROGRESS);
  return (
    <TaskProgressContext.Provider value={{ ...progress, reportProgress: setProgress }}>
      {children}
    </TaskProgressContext.Provider>
  );
}

export function useTaskProgress(): TaskProgressApi {
  const ctx = useContext(TaskProgressContext);
  if (!ctx) throw new Error("useTaskProgress must be used within TaskProgressProvider");
  return ctx;
}

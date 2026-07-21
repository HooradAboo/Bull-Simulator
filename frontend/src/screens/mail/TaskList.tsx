import { CheckmarkCircle16Filled, Circle16Regular } from "@fluentui/react-icons";
import { useTaskProgress } from "../../taskProgress";
import type { Subtask, TaskConfig } from "../../types";

interface Props {
  tasks: TaskConfig[];
}

function isSubtaskDone(
  subtask: Subtask,
  progress: {
    processedCount: number;
    totalEmails: number;
    usedActions: Set<string>;
  }
): boolean {
  if (subtask.type === "process_all_emails") {
    return progress.totalEmails > 0 && progress.processedCount >= progress.totalEmails;
  }
  if (subtask.type === "action_used" && subtask.action) {
    return progress.usedActions.has(subtask.action);
  }
  return false;
}

export function TaskList({ tasks }: Props) {
  const progress = useTaskProgress();

  return (
    <div className="sidebar-task-list">
      <div className="sidebar-task-list-header">Your Tasks</div>
      <div className="sidebar-task-list-body">
        {tasks.map((task) => (
          <div key={task.id} className="sidebar-task-group">
            <div className="sidebar-task-title">{task.title}</div>
            {task.subtasks.map((subtask) => {
              const done = isSubtaskDone(subtask, progress);
              const label =
                subtask.type === "process_all_emails"
                  ? `${subtask.label} (${progress.processedCount}/${progress.totalEmails})`
                  : subtask.label;
              const indented = subtask.type === "action_used";
              return (
                <div
                  key={subtask.id}
                  className={`sidebar-task-item ${indented ? "sidebar-task-item-indent" : ""}`}
                >
                  <span className="sidebar-task-icon" aria-hidden="true">
                    {done ? <CheckmarkCircle16Filled /> : <Circle16Regular />}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

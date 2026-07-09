import { useState } from "react";
import { CheckmarkCircle16Filled, Circle16Regular } from "@fluentui/react-icons";
import { useTaskProgress } from "../../taskProgress";
import type { Subtask, TaskConfig } from "../../types";

interface Props {
  tasks: TaskConfig[];
}

function isSubtaskDone(
  subtask: Subtask,
  progress: { processedCount: number; totalEmails: number; usedActions: Set<string> }
): boolean {
  if (subtask.type === "process_all_emails") {
    return progress.totalEmails > 0 && progress.processedCount >= progress.totalEmails;
  }
  if (subtask.type === "action_used" && subtask.action) {
    return progress.usedActions.has(subtask.action);
  }
  return false;
}

export function FloatingTaskList({ tasks }: Props) {
  const progress = useTaskProgress();
  const [position, setPosition] = useState(() => ({
    top: 80,
    left: Math.max(20, window.innerWidth - 300),
  }));

  const handleDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const originTop = position.top;
    const originLeft = position.left;

    const handleMove = (ev: MouseEvent) => {
      setPosition({
        top: Math.max(0, originTop + (ev.clientY - startY)),
        left: Math.max(0, originLeft + (ev.clientX - startX)),
      });
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div className="floating-task-list" style={{ top: position.top, left: position.left }}>
      <div className="floating-task-list-header" onMouseDown={handleDragStart}>
        Your Tasks
      </div>
      <div className="floating-task-list-body">
        {tasks.map((task) => (
          <div key={task.id} className="floating-task-group">
            <div className="floating-task-title">{task.title}</div>
            {task.subtasks.map((subtask) => {
              const done = isSubtaskDone(subtask, progress);
              return (
                <div key={subtask.id} className="floating-task-item">
                  <span className="floating-task-icon" aria-hidden="true">
                    {done ? <CheckmarkCircle16Filled /> : <Circle16Regular />}
                  </span>
                  {subtask.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

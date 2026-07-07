import { useEffect, useRef } from "react";
import { logMouseEvents, type MouseEventLog } from "../api";

const FLUSH_INTERVAL_MS = 2000;
const MOVE_SAMPLE_MS = 50;

export function useMouseLogger(participantId: string | null) {
  const buffer = useRef<MouseEventLog[]>([]);
  const lastMove = useRef(0);

  useEffect(() => {
    if (!participantId) return;

    const push = (event: MouseEventLog) => buffer.current.push(event);

    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMove.current < MOVE_SAMPLE_MS) return;
      lastMove.current = now;
      push({
        participant_id: participantId,
        event_type: "move",
        x: e.clientX,
        y: e.clientY,
        timestamp_ms: now,
      });
    };

    const onDown = (e: MouseEvent) => {
      push({
        participant_id: participantId,
        event_type: "down",
        x: e.clientX,
        y: e.clientY,
        target: (e.target as HTMLElement)?.id || (e.target as HTMLElement)?.tagName,
        timestamp_ms: Date.now(),
      });
    };

    const onUp = (e: MouseEvent) => {
      push({
        participant_id: participantId,
        event_type: "up",
        x: e.clientX,
        y: e.clientY,
        target: (e.target as HTMLElement)?.id || (e.target as HTMLElement)?.tagName,
        timestamp_ms: Date.now(),
      });
    };

    const onClick = (e: MouseEvent) => {
      push({
        participant_id: participantId,
        event_type: "click",
        x: e.clientX,
        y: e.clientY,
        target: (e.target as HTMLElement)?.id || (e.target as HTMLElement)?.tagName,
        timestamp_ms: Date.now(),
      });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("click", onClick);

    const flush = () => {
      if (buffer.current.length === 0) return;
      const events = buffer.current;
      buffer.current = [];
      logMouseEvents(events).catch((err) => console.error("mouse flush failed", err));
    };

    const interval = setInterval(flush, FLUSH_INTERVAL_MS);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("click", onClick);
      clearInterval(interval);
      flush();
    };
  }, [participantId]);
}

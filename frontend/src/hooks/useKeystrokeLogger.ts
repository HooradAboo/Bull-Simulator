import { useEffect, useRef } from "react";
import { logKeystrokes, type KeystrokeEvent } from "../api";

const FLUSH_INTERVAL_MS = 2000;

function activeFieldId(): string {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return "none";
  return el.id || el.tagName || "unknown";
}

export function useKeystrokeLogger(participantId: string | null) {
  const buffer = useRef<KeystrokeEvent[]>([]);

  useEffect(() => {
    if (!participantId) return;

    const record = (type: "keydown" | "keyup") => (e: KeyboardEvent) => {
      buffer.current.push({
        participant_id: participantId,
        field_id: activeFieldId(),
        event_type: type,
        key: e.key,
        timestamp_ms: Date.now(),
      });
    };

    const onKeyDown = record("keydown");
    const onKeyUp = record("keyup");

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const flush = () => {
      if (buffer.current.length === 0) return;
      const events = buffer.current;
      buffer.current = [];
      logKeystrokes(events).catch((err) => console.error("keystroke flush failed", err));
    };

    const interval = setInterval(flush, FLUSH_INTERVAL_MS);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(interval);
      flush();
    };
  }, [participantId]);
}

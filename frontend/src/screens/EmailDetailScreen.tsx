import { useRef, useState } from "react";
import type { ActionType, DummyEmail } from "../types";
import { confirmInteraction, logHover, setConfidence } from "../api";

const ACTIONS: { type: ActionType; label: string }[] = [
  { type: "click_link", label: "Click Link" },
  { type: "reply", label: "Reply" },
  { type: "forward", label: "Forward" },
  { type: "report_phishing", label: "Report as Phishing" },
  { type: "delete", label: "Delete" },
  { type: "ignore", label: "Ignore" },
];

interface Props {
  email: DummyEmail;
  interactionId: number;
  openedAt: number;
  onComplete: () => void;
}

type Phase = "selecting" | "confidence";

export function EmailDetailScreen({ email, interactionId, openedAt, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("selecting");
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [confidenceValue, setConfidenceValue] = useState(50);
  const distinctActionsSelected = useRef<Set<ActionType>>(new Set());
  const hoverStart = useRef<number | null>(null);

  const handleSelectAction = (action: ActionType) => {
    setSelectedAction(action);
    distinctActionsSelected.current.add(action);
  };

  const handleLinkMouseEnter = () => {
    hoverStart.current = Date.now();
  };

  const handleLinkMouseLeave = () => {
    if (hoverStart.current === null) return;
    const start = hoverStart.current;
    hoverStart.current = null;
    logHover(interactionId, email.link ?? "", start, Date.now()).catch((err) =>
      console.error("hover log failed", err)
    );
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;
    const confirmedAt = Date.now();
    const answerChanged = distinctActionsSelected.current.size > 1;
    const timeToDecisionMs = confirmedAt - openedAt;
    await confirmInteraction(
      interactionId,
      selectedAction,
      answerChanged,
      confirmedAt,
      timeToDecisionMs
    );
    setPhase("confidence");
  };

  const handleSubmitConfidence = async () => {
    await setConfidence(interactionId, confidenceValue);
    onComplete();
  };

  return (
    <div className="screen">
      {phase === "selecting" && (
        <>
          <h1>{email.subject}</h1>
          <p>
            <strong>From:</strong> {email.sender}
          </p>
          <p className="email-body">{email.body}</p>
          {email.link && (
            <p>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                onMouseEnter={handleLinkMouseEnter}
                onMouseLeave={handleLinkMouseLeave}
              >
                {email.link}
              </a>
            </p>
          )}
          {email.attachment && (
            <p>
              <span
                className="attachment"
                onClick={(e) => e.preventDefault()}
              >
                📎 {email.attachment}
              </span>
            </p>
          )}

          <div className="action-buttons">
            {ACTIONS.map((action) => (
              <button
                key={action.type}
                className={selectedAction === action.type ? "selected" : ""}
                onClick={() => handleSelectAction(action.type)}
              >
                {action.label}
              </button>
            ))}
          </div>

          {selectedAction && (
            <button className="confirm-button" onClick={handleConfirm}>
              Confirm: {ACTIONS.find((a) => a.type === selectedAction)?.label}
            </button>
          )}
        </>
      )}

      {phase === "confidence" && (
        <>
          <h2>How confident are you that this was the right response?</h2>
          <input
            type="range"
            min={0}
            max={100}
            value={confidenceValue}
            onChange={(e) => setConfidenceValue(Number(e.target.value))}
          />
          <p>{confidenceValue}</p>
          <button onClick={handleSubmitConfidence}>Submit</button>
        </>
      )}
    </div>
  );
}

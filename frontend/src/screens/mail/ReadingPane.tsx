import type { ActionType, DummyEmail, ProcessedInfo } from "../../types";
import { avatarColor, initials, senderName } from "./avatar";

const ACTION_LABELS: Record<ActionType, string> = {
  click_link: "Click Link",
  reply: "Reply",
  forward: "Forward",
  report_phishing: "Report as Phishing",
  delete: "Delete",
  ignore: "Ignore",
};

export type ReadingPhase = "idle" | "confidence";

interface Props {
  email: DummyEmail | null;
  processedInfo: ProcessedInfo | null;
  phase: ReadingPhase;
  confidenceValue: number;
  onLinkClick: () => void;
  onLinkHoverStart: () => void;
  onLinkHoverEnd: () => void;
  onConfidenceChange: (value: number) => void;
  onSubmitConfidence: () => void;
}

export function ReadingPane({
  email,
  processedInfo,
  phase,
  confidenceValue,
  onLinkClick,
  onLinkHoverStart,
  onLinkHoverEnd,
  onConfidenceChange,
  onSubmitConfidence,
}: Props) {
  if (!email) {
    return (
      <div className="mail-reading-pane">
        <div className="reading-empty">
          <div className="envelope" aria-hidden="true">
            ✉️
          </div>
          <div className="primary">Select an item to read</div>
          <div className="secondary">Nothing is selected</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mail-reading-pane">
      <div className="reading-content">
        <div className="reading-subject">{email.subject}</div>
        <div className="reading-sender-row">
          <div
            className="reading-sender-avatar"
            style={{ background: avatarColor(email.sender) }}
          >
            {initials(email.sender)}
          </div>
          <div>
            <div className="reading-sender-name">{senderName(email.sender)}</div>
            <div className="reading-sender-meta">{email.sender}</div>
          </div>
        </div>

        {processedInfo && (
          <div className="processed-banner">
            ✅ You responded: <strong>{ACTION_LABELS[processedInfo.action]}</strong>{" "}
            (confidence {processedInfo.confidence})
          </div>
        )}

        <div className="reading-body">{email.body}</div>

        {email.link && (
          <p>
            <span
              className="reading-link"
              onClick={(e) => {
                e.preventDefault();
                if (!processedInfo) onLinkClick();
              }}
              onMouseEnter={onLinkHoverStart}
              onMouseLeave={onLinkHoverEnd}
            >
              {email.link}
            </span>
          </p>
        )}

        {email.attachment && (
          <p>
            <span className="reading-attachment" onClick={(e) => e.preventDefault()}>
              📎 {email.attachment}
            </span>
          </p>
        )}

        {!processedInfo && phase === "confidence" && (
          <div className="confidence-box">
            <h3>How confident are you that this was the right response?</h3>
            <input
              type="range"
              min={0}
              max={100}
              value={confidenceValue}
              onChange={(e) => onConfidenceChange(Number(e.target.value))}
            />
            <div className="value">{confidenceValue}</div>
            <button onClick={onSubmitConfidence}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
}

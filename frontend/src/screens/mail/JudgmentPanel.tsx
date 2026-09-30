import { CheckmarkCircle20Filled } from "@fluentui/react-icons";
import type { PerceivedLegitimacy } from "../../api";
import type { ProcessedInfo } from "../../types";

// Labels the action-confidence rating collected in ConfidenceModal.tsx after
// an action is taken - kept separate from SURENESS_OPTIONS below since that
// question asks about a different thing (confidence in the action, not
// sureness about the email's legitimacy) even though both are 1-5 scales.
const ACTION_CONFIDENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all confident" },
  { value: 2, label: "Slightly confident" },
  { value: 3, label: "Somewhat confident" },
  { value: 4, label: "Confident" },
  { value: 5, label: "Extremely confident" },
];

const SURENESS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all sure" },
  { value: 2, label: "Slightly sure" },
  { value: 3, label: "Somewhat sure" },
  { value: 4, label: "Sure" },
  { value: 5, label: "Extremely sure" },
];

const LEGITIMACY_LABELS: Record<PerceivedLegitimacy, string> = {
  trust: "Legitimate",
  suspicious: "Phishing",
};

const LEGITIMACY_OPTIONS: { value: PerceivedLegitimacy; title: string; desc: string }[] = [
  { value: "trust", title: "Legitimate", desc: "Appears to be a genuine, non-phishing email" },
  {
    value: "suspicious",
    title: "Phishing",
    desc: "Appears to be a deceptive email intended to trick the recipient",
  },
];

export type JudgmentStep = "trust" | "confidence" | "done";

interface Props {
  step: JudgmentStep;
  perceivedLegitimacy: PerceivedLegitimacy | null;
  judgmentConfidenceValue: number | null;
  processedInfo: ProcessedInfo | null;
  actionLabel: string | null;
  onSelectLegitimacy: (value: PerceivedLegitimacy) => void;
  onSelectConfidence: (value: number) => void;
}

export function JudgmentPanel({
  step,
  perceivedLegitimacy,
  judgmentConfidenceValue,
  processedInfo,
  actionLabel,
  onSelectLegitimacy,
  onSelectConfidence,
}: Props) {
  if (step === "done") {
    if (!perceivedLegitimacy && !processedInfo) return null;
    const confidenceLabel = SURENESS_OPTIONS.find(
      (option) => option.value === judgmentConfidenceValue
    )?.label;
    const actionConfidenceLabel = ACTION_CONFIDENCE_OPTIONS.find(
      (option) => option.value === processedInfo?.confidence
    )?.label;
    return (
      <div className="judgment-panel judgment-panel-done">
        {perceivedLegitimacy && (
          <div className="judgment-panel-done-row">
            <CheckmarkCircle20Filled />
            Your decision: <strong>{LEGITIMACY_LABELS[perceivedLegitimacy]}</strong>
            {confidenceLabel ? <> ({confidenceLabel})</> : null}
          </div>
        )}
        {processedInfo && actionLabel && (
          <div className="judgment-panel-done-row">
            <CheckmarkCircle20Filled />
            Your action: <strong>{actionLabel}</strong>
            {processedInfo.recipient ? <> to {processedInfo.recipient}</> : null}
            {actionConfidenceLabel ? <> ({actionConfidenceLabel})</> : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="judgment-panel">
      {step === "trust" ? (
        <>
          <div className="judgment-panel-question">How would you classify this email?</div>
          <div className="judgment-buttons">
            {LEGITIMACY_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className="judgment-button"
                onClick={() => onSelectLegitimacy(option.value)}
              >
                <span className="judgment-button-title">{option.title}</span>
                <span className="judgment-button-desc">{option.desc}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="judgment-panel-question">
            How sure are you that this email is{" "}
            {perceivedLegitimacy ? LEGITIMACY_LABELS[perceivedLegitimacy].toLowerCase() : ""}?
          </div>
          <div className="likert-options">
            {SURENESS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className="likert-option"
                onClick={() => onSelectConfidence(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

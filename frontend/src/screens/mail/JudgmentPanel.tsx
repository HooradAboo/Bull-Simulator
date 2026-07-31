import { CheckmarkCircle20Filled } from "@fluentui/react-icons";
import type { PerceivedLegitimacy } from "../../api";

const CONFIDENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all confident" },
  { value: 2, label: "Slightly confident" },
  { value: 3, label: "Somewhat confident" },
  { value: 4, label: "Confident" },
  { value: 5, label: "Extremely confident" },
];

const LEGITIMACY_LABELS: Record<PerceivedLegitimacy, string> = {
  trust: "I'd trust this email",
  suspicious: "This looks suspicious",
};

export type JudgmentStep = "trust" | "confidence" | "done";

interface Props {
  step: JudgmentStep;
  perceivedLegitimacy: PerceivedLegitimacy | null;
  judgmentConfidenceValue: number;
  onSelectLegitimacy: (value: PerceivedLegitimacy) => void;
  onSelectConfidence: (value: number) => void;
}

export function JudgmentPanel({
  step,
  perceivedLegitimacy,
  judgmentConfidenceValue,
  onSelectLegitimacy,
  onSelectConfidence,
}: Props) {
  if (step === "done") {
    if (!perceivedLegitimacy) return null;
    const confidenceLabel = CONFIDENCE_OPTIONS.find(
      (option) => option.value === judgmentConfidenceValue
    )?.label;
    return (
      <div className="judgment-panel judgment-panel-done">
        <CheckmarkCircle20Filled />
        You said: <strong>{LEGITIMACY_LABELS[perceivedLegitimacy]}</strong>
        {confidenceLabel ? <> ({confidenceLabel})</> : null}
      </div>
    );
  }

  return (
    <div className="judgment-panel">
      {step === "trust" ? (
        <>
          <div className="judgment-panel-question">
            Do you trust this email, or does it look suspicious?
          </div>
          <div className="judgment-buttons">
            <button
              type="button"
              className="judgment-button"
              onClick={() => onSelectLegitimacy("trust")}
            >
              I'd trust this email
            </button>
            <button
              type="button"
              className="judgment-button"
              onClick={() => onSelectLegitimacy("suspicious")}
            >
              This looks suspicious
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="judgment-panel-question">How confident are you in that decision?</div>
          <div className="likert-options">
            {CONFIDENCE_OPTIONS.map((option) => (
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

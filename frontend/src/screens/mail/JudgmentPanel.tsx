import { CheckmarkCircle20Filled } from "@fluentui/react-icons";
import type { PerceivedLegitimacy } from "../../api";
import type { ProcessedInfo } from "../../types";

// Shared by both the decision-sureness rating here and the action-sureness
// rating collected in ConfidenceModal.tsx (see its own copy of this list) -
// same 1-5 scale and wording for both.
const SURENESS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all sure" },
  { value: 2, label: "Slightly sure" },
  { value: 3, label: "Somewhat sure" },
  { value: 4, label: "Sure" },
  { value: 5, label: "Extremely sure" },
];

// Exported so MailClientScreen/TutorialScreen can phrase the decision-
// sureness question ("...is legitimate/phishing?") now asked later, in
// ConfidenceModal's first step, without duplicating this lookup.
export const LEGITIMACY_LABELS: Record<PerceivedLegitimacy, string> = {
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

export type JudgmentStep = "trust" | "done";

interface Props {
  step: JudgmentStep;
  perceivedLegitimacy: PerceivedLegitimacy | null;
  judgmentConfidenceValue: number | null;
  processedInfo: ProcessedInfo | null;
  actionLabel: string | null;
  onSelectLegitimacy: (value: PerceivedLegitimacy) => void;
}

export function JudgmentPanel({
  step,
  perceivedLegitimacy,
  judgmentConfidenceValue,
  processedInfo,
  actionLabel,
  onSelectLegitimacy,
}: Props) {
  if (step === "done") {
    if (!perceivedLegitimacy && !processedInfo) return null;
    const confidenceLabel = SURENESS_OPTIONS.find(
      (option) => option.value === judgmentConfidenceValue
    )?.label;
    const actionConfidenceLabel = SURENESS_OPTIONS.find(
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
    </div>
  );
}

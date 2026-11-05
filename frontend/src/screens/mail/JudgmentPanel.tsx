import { CheckmarkCircle20Filled } from "@fluentui/react-icons";
import type { PerceivedLegitimacy } from "../../api";
import type { ProcessedInfo } from "../../types";
import { SURENESS_OPTIONS } from "./confidenceOptions";

// Exported so MailClientScreen/TutorialScreen/ConfidenceModal can phrase the
// legitimacy question and its summary without duplicating this lookup.
export const LEGITIMACY_LABELS: Record<PerceivedLegitimacy, string> = {
  trust: "Legitimate",
  suspicious: "Phishing",
};

interface Props {
  processedInfo: ProcessedInfo | null;
  actionLabel: string | null;
}

// Classifying the email as legitimate/phishing happens after the action now
// (inside ConfidenceModal), not here - so this panel only ever shows the
// summary of what was already decided, once an email has been processed.
export function JudgmentPanel({ processedInfo, actionLabel }: Props) {
  if (!processedInfo) return null;

  const confidenceLabel = SURENESS_OPTIONS.find(
    (option) => option.value === processedInfo.judgmentConfidenceRating
  )?.label;
  const actionConfidenceLabel = SURENESS_OPTIONS.find(
    (option) => option.value === processedInfo.confidence
  )?.label;

  return (
    <div className="judgment-panel judgment-panel-done">
      {processedInfo.perceivedLegitimacy && (
        <div className="judgment-panel-done-row">
          <CheckmarkCircle20Filled />
          Your decision: <strong>{LEGITIMACY_LABELS[processedInfo.perceivedLegitimacy]}</strong>
          {confidenceLabel ? <> ({confidenceLabel})</> : null}
        </div>
      )}
      {actionLabel && (
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

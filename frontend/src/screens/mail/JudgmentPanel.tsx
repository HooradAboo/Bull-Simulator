import { CheckmarkCircle20Filled } from "@fluentui/react-icons";
import type { ProcessedInfo } from "../../types";
import { SURENESS_OPTIONS } from "./confidenceOptions";

interface Props {
  processedInfo: ProcessedInfo | null;
  actionLabel: string | null;
}

// Shows a summary of the action taken on an email, once it's been
// processed - there's no "before" state to render anymore since the first
// response to an email is always the real action.
export function JudgmentPanel({ processedInfo, actionLabel }: Props) {
  if (!processedInfo || !actionLabel) return null;

  const actionConfidenceLabel = SURENESS_OPTIONS.find(
    (option) => option.value === processedInfo.confidence
  )?.label;

  return (
    <div className="judgment-panel judgment-panel-done">
      <div className="judgment-panel-done-row">
        <CheckmarkCircle20Filled />
        Your action: <strong>{actionLabel}</strong>
        {processedInfo.recipient ? <> to {processedInfo.recipient}</> : null}
        {actionConfidenceLabel ? <> ({actionConfidenceLabel})</> : null}
      </div>
    </div>
  );
}

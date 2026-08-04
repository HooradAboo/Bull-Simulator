import { useState } from "react";

const CONFIDENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not at all confident" },
  { value: 2, label: "Slightly confident" },
  { value: 3, label: "Somewhat confident" },
  { value: 4, label: "Confident" },
  { value: 5, label: "Extremely confident" },
];

const DIFFICULTY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Very easy" },
  { value: 2, label: "Somewhat easy" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Somewhat difficult" },
  { value: 5, label: "Very difficult" },
];

const TOTAL_STEPS = 3;

interface Props {
  actionLabel: string;
  cueOptions: { key: string; label: string }[];
  reasonOptions: { key: string; label: string }[];
  confidenceValue: number | null;
  onConfidenceChange: (value: number) => void;
  difficultyValue: number | null;
  onDifficultyChange: (value: number) => void;
  selectedCues: string[];
  onToggleCue: (cueKey: string) => void;
  otherCueText: string;
  onOtherCueTextChange: (text: string) => void;
  selectedReasons: string[];
  onToggleReason: (reasonKey: string) => void;
  otherReasonText: string;
  onOtherReasonTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function ConfidenceModal({
  actionLabel,
  cueOptions,
  reasonOptions,
  confidenceValue,
  onConfidenceChange,
  difficultyValue,
  onDifficultyChange,
  selectedCues,
  onToggleCue,
  otherCueText,
  onOtherCueTextChange,
  selectedReasons,
  onToggleReason,
  otherReasonText,
  onOtherReasonTextChange,
  onSubmit,
}: Props) {
  const [step, setStep] = useState(1);
  const isOtherCueSelected = selectedCues.includes("other");
  const isOtherReasonSelected = selectedReasons.includes("other");
  // Every step requires an explicit answer before moving on - none of these
  // questions have a default, so Next/Submit stays disabled until at least
  // one option is picked, and picking "Something else" also requires
  // actually writing it down.
  const canLeaveStep1 = confidenceValue !== null && difficultyValue !== null;
  const canLeaveStep2 =
    selectedCues.length > 0 && (!isOtherCueSelected || otherCueText.trim().length > 0);
  const canLeaveStep3 =
    selectedReasons.length > 0 && (!isOtherReasonSelected || otherReasonText.trim().length > 0);
  const canLeaveCurrentStep =
    step === 1 ? canLeaveStep1 : step === 2 ? canLeaveStep2 : canLeaveStep3;

  return (
    <div className="modal-backdrop">
      <div className="confidence-box">
        <div className="confidence-step-indicator">
          Step {step} of {TOTAL_STEPS}
        </div>

        {step === 1 && (
          <>
            <h3>How confident are you that {actionLabel ? `"${actionLabel}"` : "this"} was the right response?</h3>
            <div className="likert-options">
              {CONFIDENCE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`likert-option${confidenceValue === option.value ? " selected" : ""}`}
                  onClick={() => onConfidenceChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <h3 className="confidence-second-h3">How difficult was this decision?</h3>
            <div className="likert-options">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`likert-option${difficultyValue === option.value ? " selected" : ""}`}
                  onClick={() => onDifficultyChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Which parts of the message influenced your decision? Select all that apply.</h3>
            <div className="cue-options">
              {cueOptions.filter((cue) => cue.key !== "other").map((cue) => (
                <label key={cue.key} className="cue-option">
                  <input
                    type="checkbox"
                    checked={selectedCues.includes(cue.key)}
                    onChange={() => onToggleCue(cue.key)}
                  />
                  {cue.label}
                </label>
              ))}
              <label className="cue-option cue-option-other">
                <input
                  type="checkbox"
                  checked={isOtherCueSelected}
                  onChange={() => onToggleCue("other")}
                />
                {isOtherCueSelected ? (
                  <input
                    type="text"
                    className="cue-other-inline-input"
                    placeholder="Something else..."
                    value={otherCueText}
                    onChange={(e) => onOtherCueTextChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  "Something else"
                )}
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Why did you choose {actionLabel ? `"${actionLabel}"` : "this response"}? Select all that apply.</h3>
            <div className="cue-options cue-options-single-column">
              {reasonOptions
                .filter((reason) => reason.key !== "other")
                .map((reason) => (
                  <label key={reason.key} className="cue-option">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason.key)}
                      onChange={() => onToggleReason(reason.key)}
                    />
                    {reason.label}
                  </label>
                ))}
              <label className="cue-option cue-option-other">
                <input
                  type="checkbox"
                  checked={isOtherReasonSelected}
                  onChange={() => onToggleReason("other")}
                />
                {isOtherReasonSelected ? (
                  <input
                    type="text"
                    className="cue-other-inline-input"
                    placeholder="Something else..."
                    value={otherReasonText}
                    onChange={(e) => onOtherReasonTextChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  "Something else"
                )}
              </label>
            </div>
          </>
        )}

        <div className="confidence-nav">
          {step > 1 ? (
            <button type="button" className="confidence-back" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <button type="button" className="confidence-back" style={{ visibility: "hidden" }}>
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              className="confidence-submit"
              disabled={!canLeaveCurrentStep}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button className="confidence-submit" disabled={!canLeaveCurrentStep} onClick={onSubmit}>
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

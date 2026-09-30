import { useState } from "react";
import { SURENESS_OPTIONS } from "./confidenceOptions";

const TOTAL_STEPS = 2;

interface Props {
  actionLabel: string;
  cueOptions: { key: string; label: string }[];
  legitimacyLabel: string | null;
  judgmentConfidenceValue: number | null;
  onJudgmentConfidenceChange: (value: number) => void;
  confidenceValue: number | null;
  onConfidenceChange: (value: number) => void;
  selectedCues: string[];
  onToggleCue: (cueKey: string) => void;
  otherCueText: string;
  onOtherCueTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function ConfidenceModal({
  actionLabel,
  cueOptions,
  legitimacyLabel,
  judgmentConfidenceValue,
  onJudgmentConfidenceChange,
  confidenceValue,
  onConfidenceChange,
  selectedCues,
  onToggleCue,
  otherCueText,
  onOtherCueTextChange,
  onSubmit,
}: Props) {
  const [step, setStep] = useState(1);
  const isOtherCueSelected = selectedCues.includes("other");
  // Every step requires an explicit answer before moving on - none of these
  // questions have a default, so Next/Submit stays disabled until at least
  // one option is picked, and picking "Something else" also requires
  // actually writing it down.
  const canLeaveStep1 = judgmentConfidenceValue !== null && confidenceValue !== null;
  const canLeaveStep2 =
    selectedCues.length > 0 && (!isOtherCueSelected || otherCueText.trim().length > 0);
  const canLeaveCurrentStep = step === 1 ? canLeaveStep1 : canLeaveStep2;

  return (
    <div className="modal-backdrop">
      <div className="confidence-box">
        <div className="confidence-step-indicator">
          Step {step} of {TOTAL_STEPS}
        </div>

        {step === 1 && (
          <>
            <h3>
              How sure are you that this email is "{legitimacyLabel ?? "what you said"}"?
            </h3>
            <div className="likert-options">
              {SURENESS_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`likert-option${judgmentConfidenceValue === option.value ? " selected" : ""}`}
                  onClick={() => onJudgmentConfidenceChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <h3 className="confidence-second-h3">
              How sure are you that {actionLabel ? `"${actionLabel}"` : "this"} was the right response?
            </h3>
            <div className="likert-options">
              {SURENESS_OPTIONS.map((option) => (
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

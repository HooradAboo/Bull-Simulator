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

const CUE_OPTIONS: { key: string; label: string }[] = [
  { key: "sender", label: "Sender" },
  { key: "subject_line", label: "Subject line" },
  { key: "links", label: "Links" },
  { key: "attachments", label: "Attachments" },
  { key: "wording_tone", label: "Wording/tone" },
  { key: "urgency", label: "Urgency" },
  { key: "personal_info_request", label: "Request for personal information" },
  { key: "spelling_grammar", label: "Spelling/grammar" },
  { key: "branding_logo", label: "Branding/logo" },
  { key: "other", label: "Something else" },
];

const TOTAL_STEPS = 2;

interface Props {
  actionLabel: string;
  confidenceValue: number;
  onConfidenceChange: (value: number) => void;
  difficultyValue: number;
  onDifficultyChange: (value: number) => void;
  selectedCues: string[];
  onToggleCue: (cueKey: string) => void;
  otherCueText: string;
  onOtherCueTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function ConfidenceModal({
  actionLabel,
  confidenceValue,
  onConfidenceChange,
  difficultyValue,
  onDifficultyChange,
  selectedCues,
  onToggleCue,
  otherCueText,
  onOtherCueTextChange,
  onSubmit,
}: Props) {
  const [step, setStep] = useState(1);
  const isOtherSelected = selectedCues.includes("other");

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
              {CUE_OPTIONS.filter((cue) => cue.key !== "other").map((cue) => (
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
                  checked={isOtherSelected}
                  onChange={() => onToggleCue("other")}
                />
                {isOtherSelected ? (
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
            <button type="button" className="confidence-submit" onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button className="confidence-submit" onClick={onSubmit}>
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

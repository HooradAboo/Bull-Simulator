import { useState } from "react";
import type { ActionType } from "../../types";

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

// Actions cluster into a few underlying motivations rather than needing a
// fully separate reason list per action - e.g. Delete and Report share the
// same "protective/distrust" reasoning, while Reply/Forward/Click/Open share
// "engaging/trust" reasoning.
type ReasonGroup = "protective" | "engaging" | "deferring" | "verifying";

const ACTION_REASON_GROUP: Record<ActionType, ReasonGroup> = {
  delete: "protective",
  report_phishing: "protective",
  reply: "engaging",
  forward: "engaging",
  click_link: "engaging",
  open_attachment: "engaging",
  ignore: "deferring",
  verify_independently: "verifying",
};

const REASON_OPTIONS: Record<ReasonGroup, { key: string; label: string }[]> = {
  protective: [
    { key: "unfamiliar_sender", label: "The sender looked unfamiliar or suspicious" },
    { key: "asked_for_info", label: "It asked for personal or account information" },
    { key: "urgent_pressure", label: "It used urgent or pressuring language" },
    { key: "wording_off", label: "Something about the wording/formatting felt off" },
    { key: "distrust_link_attachment", label: "I didn't trust the link or attachment" },
    { key: "other", label: "Something else" },
  ],
  engaging: [
    { key: "trusted_sender", label: "I recognized and trusted the sender" },
    { key: "reasonable_request", label: "The request seemed reasonable and routine" },
    { key: "curious", label: "I wanted to see what it was about" },
    { key: "relevant", label: "It seemed relevant to my work/life" },
    { key: "needed_info", label: "I needed the information or file" },
    { key: "other", label: "Something else" },
  ],
  deferring: [
    { key: "unsure", label: "I wasn't sure what to do about it" },
    { key: "not_urgent", label: "It didn't seem urgent" },
    { key: "deal_later", label: "I wanted to deal with it later" },
    { key: "legit_no_response", label: "It seemed legitimate but didn't require a response" },
    { key: "other", label: "Something else" },
  ],
  verifying: [
    { key: "not_sure_legit", label: "I wasn't sure if it was legitimate" },
    { key: "confirm_first", label: "I wanted to confirm before taking any action" },
    { key: "somewhat_suspicious", label: "Something about it seemed suspicious but not definitively" },
    { key: "habit_check", label: "It's my habit to check before responding to this kind of request" },
    { key: "other", label: "Something else" },
  ],
};

const TOTAL_STEPS = 3;

interface Props {
  action: ActionType | null;
  actionLabel: string;
  confidenceValue: number;
  onConfidenceChange: (value: number) => void;
  difficultyValue: number;
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
  action,
  actionLabel,
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
  const reasonOptions = REASON_OPTIONS[action ? ACTION_REASON_GROUP[action] : "deferring"];

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
            <div className="cue-options">
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

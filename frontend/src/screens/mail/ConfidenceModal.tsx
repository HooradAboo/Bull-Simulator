import type { PerceivedLegitimacy } from "../../api";

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

interface Props {
  perceivedLegitimacy: PerceivedLegitimacy | null;
  onPerceivedLegitimacyChange: (value: PerceivedLegitimacy) => void;
  judgmentConfidenceValue: number;
  onJudgmentConfidenceChange: (value: number) => void;
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
  perceivedLegitimacy,
  onPerceivedLegitimacyChange,
  judgmentConfidenceValue,
  onJudgmentConfidenceChange,
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
  return (
    <div className="modal-backdrop">
      <div className="confidence-box">
        <h3>Do you trust this email, or does it look suspicious?</h3>
        <div className="judgment-buttons">
          <button
            type="button"
            className={`judgment-button${perceivedLegitimacy === "trust" ? " selected" : ""}`}
            onClick={() => onPerceivedLegitimacyChange("trust")}
          >
            I'd trust this email
          </button>
          <button
            type="button"
            className={`judgment-button${perceivedLegitimacy === "suspicious" ? " selected" : ""}`}
            onClick={() => onPerceivedLegitimacyChange("suspicious")}
          >
            This looks suspicious
          </button>
        </div>

        <h3>How confident are you in that decision?</h3>
        <div className="slider-track-wrap">
          <div className="slider-value-bubble" style={{ left: `${judgmentConfidenceValue}%` }}>
            {judgmentConfidenceValue}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={judgmentConfidenceValue}
            onChange={(e) => onJudgmentConfidenceChange(Number(e.target.value))}
          />
        </div>
        <div className="confidence-scale-labels">
          <span>Not at all confident</span>
          <span>Extremely confident</span>
        </div>

        <h3>Which parts of the message influenced your decision? Select all that apply.</h3>
        <div className="cue-options">
          {CUE_OPTIONS.map((cue) => (
            <label key={cue.key} className="cue-option">
              <input
                type="checkbox"
                checked={selectedCues.includes(cue.key)}
                onChange={() => onToggleCue(cue.key)}
              />
              {cue.label}
            </label>
          ))}
        </div>
        {selectedCues.includes("other") && (
          <input
            type="text"
            className="cue-other-input"
            placeholder="What else influenced your decision?"
            value={otherCueText}
            onChange={(e) => onOtherCueTextChange(e.target.value)}
          />
        )}

        <h3>How confident are you that {actionLabel ? `"${actionLabel}"` : "this"} was the right response?</h3>
        <div className="slider-track-wrap">
          <div className="slider-value-bubble" style={{ left: `${confidenceValue}%` }}>
            {confidenceValue}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={confidenceValue}
            onChange={(e) => onConfidenceChange(Number(e.target.value))}
          />
        </div>
        <div className="confidence-scale-labels">
          <span>Not at all confident</span>
          <span>Extremely confident</span>
        </div>

        <h3>How difficult was this decision?</h3>
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

        <button
          className="confidence-submit"
          onClick={onSubmit}
          disabled={perceivedLegitimacy === null}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

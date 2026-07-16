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

        <h3>How confident are you that this was the right response?</h3>
        <input
          type="range"
          min={0}
          max={100}
          value={confidenceValue}
          onChange={(e) => onConfidenceChange(Number(e.target.value))}
        />
        <div className="confidence-scale-labels">
          <span>Not at all confident</span>
          <span>Extremely confident</span>
        </div>
        <div className="value">{confidenceValue}</div>

        <h3>How difficult was this decision?</h3>
        <input
          type="range"
          min={0}
          max={100}
          value={difficultyValue}
          onChange={(e) => onDifficultyChange(Number(e.target.value))}
        />
        <div className="confidence-scale-labels">
          <span>Very easy</span>
          <span>Very difficult</span>
        </div>
        <div className="value">{difficultyValue}</div>

        <button onClick={onSubmit}>Submit</button>
      </div>
    </div>
  );
}

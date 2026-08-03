interface Option {
  key: string;
  label: string;
}

interface Props {
  roleOptions: Option[];
  selectedRole: string | null;
  onSelectRole: (roleKey: string) => void;
  otherRoleText: string;
  onOtherRoleTextChange: (text: string) => void;
  reasonOptions: Option[];
  selectedReasons: string[];
  onToggleReason: (reasonKey: string) => void;
  otherReasonText: string;
  onOtherReasonTextChange: (text: string) => void;
  onSubmit: () => void;
}

export function ComposeFollowupModal({
  roleOptions,
  selectedRole,
  onSelectRole,
  otherRoleText,
  onOtherRoleTextChange,
  reasonOptions,
  selectedReasons,
  onToggleReason,
  otherReasonText,
  onOtherReasonTextChange,
  onSubmit,
}: Props) {
  const isOtherRoleSelected = selectedRole === "other";
  const isOtherReasonSelected = selectedReasons.includes("other");

  return (
    <div className="modal-backdrop">
      <div className="confidence-box compose-followup-box">
        <h3>Who did you send this to? What is their role to you?</h3>
        <div className="cue-options">
          {roleOptions
            .filter((option) => option.key !== "other")
            .map((option) => (
              <label key={option.key} className="cue-option">
                <input
                  type="radio"
                  name="compose-role"
                  checked={selectedRole === option.key}
                  onChange={() => onSelectRole(option.key)}
                />
                {option.label}
              </label>
            ))}
          <label className="cue-option cue-option-other">
            <input
              type="radio"
              name="compose-role"
              checked={isOtherRoleSelected}
              onChange={() => onSelectRole("other")}
            />
            {isOtherRoleSelected ? (
              <input
                type="text"
                className="cue-other-inline-input"
                placeholder="Describe their role..."
                value={otherRoleText}
                onChange={(e) => onOtherRoleTextChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              "Other"
            )}
          </label>
        </div>

        <h3 className="confidence-second-h3">Why did you send this email? Select all that apply.</h3>
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

        <div className="confidence-nav">
          <span />
          <button className="confidence-submit" onClick={onSubmit} disabled={!selectedRole}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

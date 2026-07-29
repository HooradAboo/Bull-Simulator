import { CheckmarkCircle48Regular } from "@fluentui/react-icons";

interface Props {
  onContinue: () => void;
}

export function ActionRecordedModal({ onContinue }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="action-recorded-box">
        <CheckmarkCircle48Regular className="action-recorded-icon" />
        <div className="action-recorded-title">This action has been recorded</div>
        <div className="action-recorded-subtitle">You can continue with your tasks.</div>
        <button className="action-recorded-button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

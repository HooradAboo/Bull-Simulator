interface Props {
  onYes: () => void;
  onNo: () => void;
}

export function ChangePasswordPrompt({ onYes, onNo }: Props) {
  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>Would you like to change your password?</h3>
        <p>You can update it now, or keep your current password and do it later.</p>
        <div className="confirm-action-buttons">
          <button className="confirm-action-cancel" onClick={onNo}>
            Not Now
          </button>
          <button className="confirm-action-confirm" onClick={onYes}>
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}

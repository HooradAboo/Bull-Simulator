import { useState } from "react";
import "./login.css";

interface Props {
  onSubmit: (newPassword: string) => void;
  onCancel: () => void;
}

export function ChangePasswordForm({ onSubmit, onCancel }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (newPassword.length === 0) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    onSubmit(newPassword);
  };

  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        <h3>Change your password</h3>
        <input
          id="new-password"
          type="password"
          className="login-input"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          id="confirm-new-password"
          type="password"
          className="login-input"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <div className="login-error">{error}</div>}
        <div className="confirm-action-buttons">
          <button className="confirm-action-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-action-confirm" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

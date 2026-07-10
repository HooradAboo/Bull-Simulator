import { useState } from "react";

interface Props {
  expectedEmail: string;
  onReset: (email: string) => Promise<void>;
  onClose: () => void;
}

export function ResetPasswordModal({ expectedEmail, onReset, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [netId, setNetId] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (trimmed.toLowerCase() !== expectedEmail.trim().toLowerCase()) {
      setError("We couldn't find an account with that email address.");
      return;
    }
    setError(null);
    const resetNetId = trimmed.split("@")[0];
    await onReset(resetNetId);
    setNetId(resetNetId);
  };

  return (
    <div className="modal-backdrop">
      <div className="confirm-action-box">
        {netId === null ? (
          <>
            <h3>Reset your password</h3>
            <p>Enter your USF email address and we'll reset your password to your NetID.</p>
            <input
              id="reset-email"
              type="text"
              className="login-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {error && <div className="login-error">{error}</div>}
            <div className="confirm-action-buttons">
              <button className="confirm-action-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="confirm-action-confirm" onClick={handleSubmit}>
                Reset Password
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Password reset</h3>
            <p>
              Your password has been reset to your NetID: <strong>{netId}</strong>
            </p>
            <div className="confirm-action-buttons">
              <button className="confirm-action-confirm" onClick={onClose}>
                Back to Sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

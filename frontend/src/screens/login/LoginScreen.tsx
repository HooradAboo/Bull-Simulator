import { useState } from "react";
import "./login.css";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { updateCredentialPassword } from "../../api";

interface Props {
  expectedEmail: string;
  expectedPassword: string;
  credentialId: number;
  onSuccess: () => void;
}

export function LoginScreen({ expectedEmail, expectedPassword, credentialId, onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = () => {
    const emailMatches = email.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
    const passwordMatches = password === expectedPassword;

    if (!emailMatches || !passwordMatches) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    setError(null);
    onSuccess();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-wordmark">
          <span className="login-wordmark-line1">UNIVERSITY OF</span>
          <span className="login-wordmark-line2">SOUTH FLORIDA</span>
        </div>

        <h1 className="login-heading">Sign in</h1>

        <input
          id="login-email"
          type="text"
          className="login-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          id="login-password"
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        {error && <div className="login-error">{error}</div>}

        <a
          className="login-help-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowReset(true);
          }}
        >
          Reset password
        </a>

        <div className="login-submit-row">
          <button className="login-submit" onClick={handleSubmit}>
            Sign in
          </button>
        </div>
      </div>

      <div className="login-footer">
        By logging in you agree to follow the USF's{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>
          Acceptable Use Policy
        </a>
        .
      </div>

      {showReset && (
        <ResetPasswordModal
          expectedEmail={expectedEmail}
          onReset={async (netId) => {
            await updateCredentialPassword(credentialId, netId);
          }}
          onClose={() => setShowReset(false)}
        />
      )}
    </div>
  );
}

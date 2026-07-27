import { useState } from "react";
import { ArrowLeft20Regular } from "@fluentui/react-icons";
import "./login.css";
import { ResetPasswordScreen } from "./ResetPasswordScreen";
import { updateCredentialPassword } from "../../api";
import usfLogoGreen from "../../assets/usf-logo-green.png";
import bullBackground from "../../assets/bull-background.jpeg";

interface Props {
  expectedEmail: string;
  expectedPassword: string;
  credentialId: number;
  onSuccess: () => void;
}

export function LoginScreen({ expectedEmail, expectedPassword, credentialId, onSuccess }: Props) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  if (showReset) {
    return (
      <ResetPasswordScreen
        expectedEmail={expectedEmail}
        onReset={async (netId) => {
          await updateCredentialPassword(credentialId, netId);
        }}
        onBack={() => setShowReset(false)}
      />
    );
  }

  const handleNext = () => {
    if (email.trim().length === 0) {
      setError("Enter your NetID email address.");
      return;
    }
    setError(null);
    setStep("password");
  };

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
    <div
      className="usflogin-page"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bullBackground})`,
      }}
    >
      {import.meta.env.DEV && (
        <button className="dev-skip-button" onClick={onSuccess}>
          DEV: Skip Sign In
        </button>
      )}
      <div className="usflogin-container">
        <div className="usflogin-block">
          <div className={`usflogin-card${error ? " usflogin-card-error" : ""}`}>
            <img src={usfLogoGreen} alt="University of South Florida" className="usflogin-logo" />

            {step === "email" ? (
              <>
                <div className="usflogin-back-row" style={{ visibility: "hidden" }} aria-hidden="true">
                  <ArrowLeft20Regular />
                  <span>placeholder</span>
                </div>
                <h1 className="usflogin-heading">Sign in</h1>
                <input
                  id="login-email"
                  type="text"
                  className="usflogin-input"
                  placeholder="Sign-in with your NetID@usf.edu (not U#)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNext();
                  }}
                  autoFocus
                />
                {error && <div className="usflogin-error">{error}</div>}
                <a
                  className="usflogin-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowReset(true);
                  }}
                >
                  Can't access your account?
                </a>
                <div className="usflogin-actions">
                  <button className="usflogin-btn" onClick={handleNext}>
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  className="usflogin-back-row"
                  onClick={() => {
                    setError(null);
                    setStep("email");
                  }}
                >
                  <ArrowLeft20Regular />
                  <span>{email}</span>
                </div>
                <h1 className="usflogin-heading">Enter password</h1>
                <input
                  id="login-password"
                  type="password"
                  className="usflogin-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  autoFocus
                />
                {error && <div className="usflogin-error">{error}</div>}
                <a
                  className="usflogin-link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowReset(true);
                  }}
                >
                  Forgot my password
                </a>
                <div className="usflogin-actions">
                  <button className="usflogin-btn" onClick={handleSubmit}>
                    Sign in
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="usflogin-policy">
            By logging in you agree to follow the USF's{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Acceptable Use Policy
            </a>
            .
          </div>
        </div>
      </div>

      <div className="usflogin-footer">
        <a href="#" onClick={(e) => e.preventDefault()}>
          Terms of use
        </a>
        <a href="#" onClick={(e) => e.preventDefault()}>
          Privacy &amp; cookies
        </a>
        <span>&bull;&bull;&bull;</span>
      </div>
    </div>
  );
}

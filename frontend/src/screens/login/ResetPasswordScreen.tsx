import { useState } from "react";
import { ArrowClockwise20Regular, Speaker220Regular } from "@fluentui/react-icons";
import usfLogoGreen from "../../assets/usf-logo-green.png";

interface Props {
  expectedEmail: string;
  onReset: (netId: string) => Promise<void>;
  onBack: () => void;
}

function CaptchaImage() {
  return (
    <svg viewBox="0 0 200 90" className="reset-captcha-svg" aria-hidden="true">
      <rect width="200" height="90" fill="#fbeaf0" />
      <path
        d="M20 60 Q35 20 50 55 T80 45 T110 60"
        fill="none"
        stroke="#8a6fae"
        strokeWidth="2"
      />
      <path
        d="M15 40 Q60 75 100 35 T175 50"
        fill="none"
        stroke="#8a6fae"
        strokeWidth="1.5"
      />
      <text
        x="30"
        y="55"
        fontFamily="Brush Script MT, cursive"
        fontSize="34"
        fill="#5b4a86"
        transform="rotate(-8 30 55)"
      >
        Jy
      </text>
      <text
        x="90"
        y="60"
        fontFamily="Brush Script MT, cursive"
        fontSize="34"
        fill="#5b4a86"
        transform="rotate(6 90 60)"
      >
        W6
      </text>
    </svg>
  );
}

export function ResetPasswordScreen({ expectedEmail, onReset, onBack }: Props) {
  const [email, setEmail] = useState(expectedEmail);
  const [captchaText, setCaptchaText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [netId, setNetId] = useState<string | null>(null);

  const handleNext = async () => {
    const trimmed = email.trim();
    if (trimmed.toLowerCase() !== expectedEmail.trim().toLowerCase()) {
      setError("We couldn't find an account with that email address.");
      return;
    }
    if (captchaText.trim().length === 0) {
      setError("Please enter the characters in the picture or the words in the audio.");
      return;
    }
    setError(null);
    const resetNetId = trimmed.split("@")[0];
    await onReset(resetNetId);
    setNetId(resetNetId);
  };

  return (
    <div className="reset-page">
      <div className="reset-logo-row">
        <img src={usfLogoGreen} alt="University of South Florida" className="reset-logo-img" />
      </div>

      {netId === null ? (
        <>
          <h1 className="reset-heading">Get back into your account</h1>
          <h2 className="reset-subheading">Who are you?</h2>
          <p className="reset-body-text">
            To recover your account, begin by entering your email or username and the
            characters in the picture or audio below.
          </p>

          <div className="reset-field">
            <label className="reset-label" htmlFor="reset-email">
              Email or Username: <span className="reset-required">*</span>
            </label>
            <input
              id="reset-email"
              type="text"
              className="reset-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="reset-hint">
              Example: user@contoso.onmicrosoft.com or user@contoso.com
            </div>
          </div>

          <div className="reset-captcha-row">
            <div className="reset-captcha-img">
              <CaptchaImage />
            </div>
            <div className="reset-captcha-icons">
              <button type="button" className="reset-icon-btn" aria-label="Play audio">
                <Speaker220Regular />
              </button>
              <button type="button" className="reset-icon-btn" aria-label="New captcha">
                <ArrowClockwise20Regular />
              </button>
            </div>
          </div>
          <div className="reset-field">
            <input
              type="text"
              className="reset-input reset-captcha-input"
              value={captchaText}
              onChange={(e) => setCaptchaText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNext();
              }}
            />
            <div className="reset-hint">
              Enter the characters in the picture or the words in the audio.{" "}
              <span className="reset-required">*</span>
            </div>
          </div>

          {error && <div className="reset-error">{error}</div>}

          <div className="reset-actions">
            <button className="reset-next-btn" onClick={handleNext}>
              Next
            </button>
            <a
              className="reset-cancel-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBack();
              }}
            >
              Cancel
            </a>
          </div>
        </>
      ) : (
        <>
          <h1 className="reset-heading">Get back into your account</h1>
          <h2 className="reset-subheading">Password reset</h2>
          <p className="reset-body-text">
            Your password has been reset to your NetID: <strong>{netId}</strong>
          </p>
          <div className="reset-actions">
            <button className="reset-next-btn" onClick={onBack}>
              Back to Sign in
            </button>
          </div>
        </>
      )}

      <div className="reset-footer">
        <span className="reset-footer-brand">Microsoft</span>
        <span className="reset-footer-copyright">©2026 Microsoft Corporation</span>
        <a className="reset-footer-support" href="#" onClick={(e) => e.preventDefault()}>
          Support code
        </a>
      </div>
    </div>
  );
}

import { useState } from "react";

interface Props {
  onContinue: (participantEmail: string) => void;
}

export function ResearcherSetupScreen({ onContinue }: Props) {
  const [email, setEmail] = useState("");

  const isValid = email.trim().length > 0 && email.includes("@");

  return (
    <div className="screen">
      <h1>Researcher Setup</h1>
      <p>
        Enter the participant's USF email address before handing over the
        laptop. This is used as their login username for the simulated
        email task and is not shown to the participant beforehand.
      </p>
      <label htmlFor="participant-email">Participant's USF email address</label>
      <input
        id="participant-email"
        type="email"
        placeholder="netid@usf.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.5rem" }}
      />
      <button disabled={!isValid} onClick={() => onContinue(email.trim())}>
        Continue
      </button>
    </div>
  );
}

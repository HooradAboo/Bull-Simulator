import { useState } from "react";

interface Props {
  onContinue: (participantEmail: string, firstName: string, lastName: string) => void;
}

export function ResearcherSetupScreen({ onContinue }: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const isValid =
    email.trim().length > 0 &&
    email.includes("@") &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0;

  return (
    <div className="screen">
      <h1>Researcher Setup</h1>
      <p>
        Enter the participant's name and USF email address before handing
        over the laptop. The email is used as their login username for the
        simulated email task; the name is used to personalize some of the
        emails. Neither is shown to the participant beforehand.
      </p>
      <label htmlFor="participant-first-name">Participant's first name</label>
      <input
        id="participant-first-name"
        type="text"
        placeholder="Alex"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.5rem" }}
      />
      <label htmlFor="participant-last-name">Participant's last name</label>
      <input
        id="participant-last-name"
        type="text"
        placeholder="Rivera"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.5rem" }}
      />
      <label htmlFor="participant-email">Participant's USF email address</label>
      <input
        id="participant-email"
        type="email"
        placeholder="netid@usf.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.5rem" }}
      />
      <button
        disabled={!isValid}
        onClick={() => onContinue(email.trim(), firstName.trim(), lastName.trim())}
      >
        Continue
      </button>
    </div>
  );
}

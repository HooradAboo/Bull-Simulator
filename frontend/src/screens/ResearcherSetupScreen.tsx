import { useEffect, useState } from "react";
import { getDepartments } from "../api";

interface Props {
  onContinue: (
    participantEmail: string,
    firstName: string,
    lastName: string,
    department: string
  ) => void;
}

export function ResearcherSetupScreen({ onContinue }: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    getDepartments().then(setDepartments);
  }, []);

  const isValid =
    email.trim().length > 0 &&
    email.includes("@") &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    department.length > 0;

  return (
    <div className="screen">
      <h1>Researcher Setup</h1>
      <p>
        Enter the participant's name, department, and USF email address
        before handing over the laptop. The email is used as their login
        username for the simulated email task; the name and department are
        used to personalize some of the emails. None of this is shown to the
        participant beforehand.
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
      <label htmlFor="participant-department">Participant's department</label>
      <select
        id="participant-department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        style={{ display: "block", width: "100%", margin: "0.5rem 0 1rem", padding: "0.5rem" }}
      >
        <option value="" disabled>
          Select a department
        </option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <button
        disabled={!isValid}
        onClick={() => onContinue(email.trim(), firstName.trim(), lastName.trim(), department)}
      >
        Continue
      </button>
    </div>
  );
}

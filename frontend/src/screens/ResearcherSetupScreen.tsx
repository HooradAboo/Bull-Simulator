import { useState } from "react";
import { getParticipantProfile } from "../api";
import { PageTemplate } from "./PageTemplate";

interface Props {
  onContinue: (
    participantEmail: string,
    firstName: string,
    lastName: string,
    netid: string
  ) => void;
}

export function ResearcherSetupScreen({ onContinue }: Props) {
  const [netid, setNetid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = netid.trim().length > 0;

  const handleSubmit = async () => {
    const trimmed = netid.trim();
    setLoading(true);
    setError(null);
    try {
      const profile = await getParticipantProfile(trimmed);
      if (!profile) {
        setError(
          `No profile found for NetID "${trimmed}". Create confidential/participants/${trimmed}.json first.`
        );
        return;
      }
      onContinue(profile.email, profile.firstName, profile.lastName, profile.netid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load participant profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Researcher Setup"
      subtitle="Enter the participant's NetID before handing over the laptop. Their
        profile (name, email, and personalization details) is loaded from a
        confidential file that never leaves this machine. None of this is
        shown to the participant beforehand."
    >
      <div className="page-field">
        <label className="page-label" htmlFor="participant-netid">
          Participant's NetID
        </label>
        <input
          id="participant-netid"
          className="page-input"
          type="text"
          placeholder="jsmith123"
          value={netid}
          onChange={(e) => setNetid(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid && !loading) handleSubmit();
          }}
        />
      </div>
      {error && <p className="page-error">{error}</p>}
      <div className="page-actions">
        <button className="page-button" disabled={!isValid || loading} onClick={handleSubmit}>
          {loading ? "Loading..." : "Continue"}
        </button>
      </div>
    </PageTemplate>
  );
}

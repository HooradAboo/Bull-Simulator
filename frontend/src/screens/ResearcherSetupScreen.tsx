import { useState } from "react";
import { getParticipantProfile, lookupParticipantByNetid, type ParticipantLookup } from "../api";
import { PageTemplate } from "./PageTemplate";

interface ResolvedProfile {
  email: string;
  firstName: string;
  lastName: string;
  netid: string;
}

interface Props {
  onContinue: (
    participantEmail: string,
    firstName: string,
    lastName: string,
    netid: string
  ) => void;
  onResume: (lookup: ParticipantLookup, profile: ResolvedProfile) => void;
}

export function ResearcherSetupScreen({ onContinue, onResume }: Props) {
  const [netid, setNetid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<{
    lookup: ParticipantLookup;
    profile: ResolvedProfile;
  } | null>(null);

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
      const resolvedProfile: ResolvedProfile = {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        netid: profile.netid,
      };
      const lookup = await lookupParticipantByNetid(trimmed);
      if (lookup && !lookup.selfEfficacyPostSubmitted) {
        setPendingChoice({ lookup, profile: resolvedProfile });
        return;
      }
      onContinue(resolvedProfile.email, resolvedProfile.firstName, resolvedProfile.lastName, resolvedProfile.netid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load participant profile.");
    } finally {
      setLoading(false);
    }
  };

  if (pendingChoice) {
    const { lookup, profile } = pendingChoice;
    return (
      <PageTemplate
        title="In-Progress Session Found"
        subtitle={`${profile.firstName} ${profile.lastName} (${profile.netid}) already has an unfinished session, with ${lookup.completedInteractions.length} email${lookup.completedInteractions.length === 1 ? "" : "s"} already processed. Resume where they left off, or start over from the beginning.`}
      >
        <div className="page-actions">
          <button className="page-button" onClick={() => onResume(lookup, profile)}>
            Resume
          </button>
          <button
            className="page-button-secondary"
            onClick={() =>
              onContinue(profile.email, profile.firstName, profile.lastName, profile.netid)
            }
          >
            Start Over
          </button>
        </div>
      </PageTemplate>
    );
  }

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

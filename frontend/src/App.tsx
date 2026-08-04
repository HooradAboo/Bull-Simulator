import { useState } from "react";
import "./App.css";
import { ResearcherSetupScreen } from "./screens/ResearcherSetupScreen";
import { ConsentScreen } from "./screens/ConsentScreen";
import { SelfEfficacyScreen } from "./screens/SelfEfficacyScreen";
import { InstructionsScreen } from "./screens/InstructionsScreen";
import { TaskStartScreen } from "./screens/TaskStartScreen";
import { MailClientScreen } from "./screens/mail/MailClientScreen";
import { TutorialScreen } from "./screens/mail/TutorialScreen";
import { DebriefScreen } from "./screens/DebriefScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { BrowserChrome } from "./screens/browser/BrowserChrome";
import { PlainTitleBar } from "./screens/browser/PlainTitleBar";
import { LoginScreen } from "./screens/login/LoginScreen";
import {
  createCredential,
  getContacts,
  getEmails,
  startSession,
  submitPostSelfEfficacy,
  type ParticipantLookup,
} from "./api";
import { useMouseLogger } from "./hooks/useMouseLogger";
import { useKeystrokeLogger } from "./hooks/useKeystrokeLogger";
import type { ActionType, Contact, DummyEmail, ProcessedInfo, SelfEfficacyRatings } from "./types";

function sortByReceivedDesc(emails: DummyEmail[]): DummyEmail[] {
  return [...emails].sort((a, b) => (b.receivedAt ?? 0) - (a.receivedAt ?? 0));
}

type Screen =
  | "researcher-setup"
  | "consent"
  | "self-efficacy"
  | "instructions"
  | "tutorial"
  | "task-start"
  | "mail"
  | "self-efficacy-post"
  | "debrief"
  | "report";

function App() {
  const [screen, setScreen] = useState<Screen>("researcher-setup");
  const [participantId, setParticipantId] = useState<string>(() => crypto.randomUUID());
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantFirstName, setParticipantFirstName] = useState("");
  const [participantLastName, setParticipantLastName] = useState("");
  const [participantNetid, setParticipantNetid] = useState("");
  const [selfEfficacy, setSelfEfficacy] = useState<SelfEfficacyRatings | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentialId, setCredentialId] = useState<number | null>(null);
  const [emails, setEmails] = useState<DummyEmail[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [initialProcessed, setInitialProcessed] = useState<Map<string, ProcessedInfo>>(new Map());

  useMouseLogger(sessionStarted ? participantId : null);
  useKeystrokeLogger(sessionStarted ? participantId : null);

  const derivedPassword = participantEmail.split("@")[0];

  const handleBegin = async () => {
    const startTs = Date.now();
    // createCredential requires the participant row to already exist
    // (foreign key), so session/start must complete first, not run
    // concurrently with it.
    await startSession(
      participantId,
      participantFirstName,
      participantLastName,
      participantNetid,
      selfEfficacy!,
      startTs
    );
    const [allEmails, allContacts, credential] = await Promise.all([
      getEmails(participantId),
      getContacts(participantId),
      createCredential(participantId, "USF Email (Outlook)", participantEmail, derivedPassword),
    ]);
    setEmails(sortByReceivedDesc(allEmails));
    setContacts(allContacts);
    setCredentialId(credential.id);
    setSessionStarted(true);
    setScreen("mail");
  };

  // Re-associates the app with an existing in-progress participant record
  // (found by netid on the researcher setup screen) instead of starting a
  // fresh one - used to recover from a mid-session crash without losing
  // already-completed emails, which are durable in the backend already.
  const handleResume = async (
    lookup: ParticipantLookup,
    profile: { email: string; firstName: string; lastName: string; netid: string }
  ) => {
    setParticipantId(lookup.participantId);
    setParticipantEmail(profile.email);
    setParticipantFirstName(profile.firstName);
    setParticipantLastName(profile.lastName);
    setParticipantNetid(profile.netid);

    const derivedPassword = profile.email.split("@")[0];
    const [allEmails, allContacts, credential] = await Promise.all([
      getEmails(lookup.participantId),
      getContacts(lookup.participantId),
      // A fresh credential row is created rather than reusing the original
      // one (there's no lookup endpoint for it) - harmless duplication,
      // since credentials aren't part of the scored report.
      createCredential(lookup.participantId, "USF Email (Outlook)", profile.email, derivedPassword),
    ]);
    const sortedEmails = sortByReceivedDesc(allEmails);
    setEmails(sortedEmails);
    setContacts(allContacts);
    setCredentialId(credential.id);

    const hydrated = new Map<string, ProcessedInfo>();
    for (const interaction of lookup.completedInteractions) {
      hydrated.set(interaction.emailId, {
        action: interaction.actionTaken as ActionType,
        confidence: interaction.confidenceRating,
        recipient: interaction.recipient,
      });
    }
    setInitialProcessed(hydrated);
    setSessionStarted(true);

    // If every email was already processed before the crash, there's
    // nothing left to resume in the inbox - skip straight to the next step.
    setScreen(hydrated.size >= sortedEmails.length ? "self-efficacy-post" : "mail");
  };

  if (screen === "tutorial") {
    return (
      <BrowserChrome primaryTabTitle="Practice Inbox - Outlook" primaryTabUrl="outlook.office.com/mail/inbox">
        <TutorialScreen onFinish={() => setScreen("task-start")} />
      </BrowserChrome>
    );
  }

  if (screen === "mail") {
    return (
      <BrowserChrome
        primaryTabTitle={loggedIn ? undefined : "Sign in"}
        primaryTabUrl={loggedIn ? undefined : "login.microsoftonline.com"}
      >
        {loggedIn ? (
          <MailClientScreen
            participantId={participantId}
            participantEmail={participantEmail}
            emails={emails}
            contacts={contacts}
            initialProcessed={initialProcessed}
            onAllProcessed={() => {
              setSessionStarted(false);
              setScreen("self-efficacy-post");
            }}
          />
        ) : (
          <LoginScreen
            expectedEmail={participantEmail}
            expectedPassword={derivedPassword}
            credentialId={credentialId!}
            onSuccess={() => setLoggedIn(true)}
          />
        )}
      </BrowserChrome>
    );
  }

  return (
    <>
      <PlainTitleBar />
      {screen === "researcher-setup" && (
        <ResearcherSetupScreen
          onContinue={(email, firstName, lastName, netid) => {
            setParticipantEmail(email);
            setParticipantFirstName(firstName);
            setParticipantLastName(lastName);
            setParticipantNetid(netid);
            setScreen("consent");
          }}
          onResume={handleResume}
        />
      )}
      {screen === "consent" && (
        <ConsentScreen onAccept={() => setScreen("self-efficacy")} />
      )}
      {screen === "self-efficacy" && (
        <SelfEfficacyScreen
          onContinue={(ratings) => {
            setSelfEfficacy(ratings);
            setScreen("instructions");
          }}
        />
      )}
      {screen === "instructions" && (
        <InstructionsScreen onBegin={() => setScreen("tutorial")} />
      )}
      {screen === "task-start" && <TaskStartScreen onBegin={handleBegin} />}
      {screen === "self-efficacy-post" && (
        <SelfEfficacyScreen
          heading="Rate Your Confidence, Revisited"
          description="Now that you've completed the task, rate your confidence again in your ability to complete the following cybersecurity tasks."
          continueLabel="Finish"
          onContinue={async (ratings) => {
            await submitPostSelfEfficacy(participantId, ratings);
            setScreen("debrief");
          }}
        />
      )}
      {screen === "debrief" && (
        <DebriefScreen onViewReport={() => setScreen("report")} />
      )}
      {screen === "report" && <ReportScreen participantId={participantId} />}
    </>
  );
}

export default App;

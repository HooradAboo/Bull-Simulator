import { useState } from "react";
import "./App.css";
import { ResearcherSetupScreen } from "./screens/ResearcherSetupScreen";
import { ConsentScreen } from "./screens/ConsentScreen";
import { InstructionsScreen } from "./screens/InstructionsScreen";
import { MailClientScreen } from "./screens/mail/MailClientScreen";
import { DebriefScreen } from "./screens/DebriefScreen";
import { BrowserChrome } from "./screens/browser/BrowserChrome";
import { PlainTitleBar } from "./screens/browser/PlainTitleBar";
import { LoginScreen } from "./screens/login/LoginScreen";
import {
  createCredential,
  getContacts,
  getEmails,
  getTasks,
  startSession,
} from "./api";
import { useMouseLogger } from "./hooks/useMouseLogger";
import { useKeystrokeLogger } from "./hooks/useKeystrokeLogger";
import { TaskProgressProvider } from "./taskProgress";
import type { Contact, DummyEmail, TaskConfig } from "./types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Screen = "researcher-setup" | "consent" | "instructions" | "mail" | "debrief";

function App() {
  const [screen, setScreen] = useState<Screen>("researcher-setup");
  const [participantId] = useState<string>(() => crypto.randomUUID());
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantFirstName, setParticipantFirstName] = useState("");
  const [participantLastName, setParticipantLastName] = useState("");
  const [participantDepartment, setParticipantDepartment] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentialId, setCredentialId] = useState<number | null>(null);
  const [emails, setEmails] = useState<DummyEmail[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);

  useMouseLogger(sessionStarted ? participantId : null);
  useKeystrokeLogger(sessionStarted ? participantId : null);

  const derivedPassword = participantEmail.split("@")[0];

  const handleBegin = async () => {
    const sessionStartTs = Date.now();
    // createCredential requires the participant row to already exist
    // (foreign key), so session/start must complete first, not run
    // concurrently with it.
    await startSession(
      participantId,
      participantFirstName,
      participantLastName,
      participantDepartment,
      sessionStartTs
    );
    const [allEmails, allContacts, allTasks, credential] = await Promise.all([
      getEmails(participantId),
      getContacts(),
      getTasks(),
      createCredential(participantId, "USF Email (Outlook)", participantEmail, derivedPassword),
    ]);
    setEmails(shuffle(allEmails));
    setContacts(allContacts);
    setTasks(allTasks);
    setCredentialId(credential.id);
    setSessionStarted(true);
    setScreen("mail");
  };

  if (screen === "mail") {
    return (
      <TaskProgressProvider>
        <BrowserChrome
          tasks={tasks}
          primaryTabTitle={loggedIn ? undefined : "Sign in"}
          primaryTabUrl={loggedIn ? undefined : "login.microsoftonline.com"}
          showTaskList={loggedIn}
        >
          {loggedIn ? (
            <MailClientScreen
              participantId={participantId}
              participantEmail={participantEmail}
              credentialId={credentialId!}
              emails={emails}
              contacts={contacts}
              tasks={tasks}
              onAllProcessed={() => setScreen("debrief")}
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
      </TaskProgressProvider>
    );
  }

  return (
    <>
      <PlainTitleBar />
      {screen === "researcher-setup" && (
        <ResearcherSetupScreen
          onContinue={(email, firstName, lastName, department) => {
            setParticipantEmail(email);
            setParticipantFirstName(firstName);
            setParticipantLastName(lastName);
            setParticipantDepartment(department);
            setScreen("consent");
          }}
        />
      )}
      {screen === "consent" && <ConsentScreen onAccept={() => setScreen("instructions")} />}
      {screen === "instructions" && <InstructionsScreen onBegin={handleBegin} />}
      {screen === "debrief" && <DebriefScreen />}
    </>
  );
}

export default App;

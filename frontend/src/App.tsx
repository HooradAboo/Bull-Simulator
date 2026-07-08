import { useState } from "react";
import "./App.css";
import { ConsentScreen } from "./screens/ConsentScreen";
import { InstructionsScreen } from "./screens/InstructionsScreen";
import { MailClientScreen } from "./screens/mail/MailClientScreen";
import { DebriefScreen } from "./screens/DebriefScreen";
import { BrowserChrome } from "./screens/browser/BrowserChrome";
import { PlainTitleBar } from "./screens/browser/PlainTitleBar";
import { getContacts, getEmails, startSession } from "./api";
import { useMouseLogger } from "./hooks/useMouseLogger";
import { useKeystrokeLogger } from "./hooks/useKeystrokeLogger";
import type { Contact, DummyEmail } from "./types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Screen = "consent" | "instructions" | "mail" | "debrief";

function App() {
  const [screen, setScreen] = useState<Screen>("consent");
  const [participantId] = useState<string>(() => crypto.randomUUID());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [emails, setEmails] = useState<DummyEmail[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useMouseLogger(sessionStarted ? participantId : null);
  useKeystrokeLogger(sessionStarted ? participantId : null);

  const handleBegin = async () => {
    const sessionStartTs = Date.now();
    const [, allEmails, allContacts] = await Promise.all([
      startSession(participantId, sessionStartTs),
      getEmails(),
      getContacts(),
    ]);
    setEmails(shuffle(allEmails));
    setContacts(allContacts);
    setSessionStarted(true);
    setScreen("mail");
  };

  if (screen === "mail") {
    return (
      <BrowserChrome>
        <MailClientScreen
          participantId={participantId}
          emails={emails}
          contacts={contacts}
          onAllProcessed={() => setScreen("debrief")}
        />
      </BrowserChrome>
    );
  }

  return (
    <>
      <PlainTitleBar />
      {screen === "consent" && <ConsentScreen onAccept={() => setScreen("instructions")} />}
      {screen === "instructions" && <InstructionsScreen onBegin={handleBegin} />}
      {screen === "debrief" && <DebriefScreen />}
    </>
  );
}

export default App;

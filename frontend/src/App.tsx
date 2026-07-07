import { useState } from "react";
import "./App.css";
import { ConsentScreen } from "./screens/ConsentScreen";
import { InstructionsScreen } from "./screens/InstructionsScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { EmailDetailScreen } from "./screens/EmailDetailScreen";
import { DebriefScreen } from "./screens/DebriefScreen";
import { getEmails, openInteraction, startSession } from "./api";
import { useMouseLogger } from "./hooks/useMouseLogger";
import { useKeystrokeLogger } from "./hooks/useKeystrokeLogger";
import type { DummyEmail } from "./types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Screen = "consent" | "instructions" | "inbox" | "detail" | "debrief";

function App() {
  const [screen, setScreen] = useState<Screen>("consent");
  const [participantId] = useState<string>(() => crypto.randomUUID());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [emails, setEmails] = useState<DummyEmail[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [currentEmail, setCurrentEmail] = useState<DummyEmail | null>(null);
  const [interactionId, setInteractionId] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);

  useMouseLogger(sessionStarted ? participantId : null);
  useKeystrokeLogger(sessionStarted ? participantId : null);

  const handleBegin = async () => {
    const sessionStartTs = Date.now();
    const [, allEmails] = await Promise.all([
      startSession(participantId, sessionStartTs),
      getEmails(),
    ]);
    setEmails(shuffle(allEmails));
    setSessionStarted(true);
    setScreen("inbox");
  };

  const handleOpenEmail = async (email: DummyEmail) => {
    const now = Date.now();
    const id = await openInteraction(participantId, email.id, now);
    setCurrentEmail(email);
    setInteractionId(id);
    setOpenedAt(now);
    setScreen("detail");
  };

  const handleEmailComplete = () => {
    if (!currentEmail) return;
    const updatedProcessed = new Set(processedIds);
    updatedProcessed.add(currentEmail.id);
    setProcessedIds(updatedProcessed);

    if (updatedProcessed.size >= emails.length) {
      setScreen("debrief");
    } else {
      setScreen("inbox");
    }
  };

  const remainingEmails = emails.filter((e) => !processedIds.has(e.id));

  return (
    <>
      {screen === "consent" && <ConsentScreen onAccept={() => setScreen("instructions")} />}
      {screen === "instructions" && <InstructionsScreen onBegin={handleBegin} />}
      {screen === "inbox" && (
        <InboxScreen emails={remainingEmails} onOpenEmail={handleOpenEmail} />
      )}
      {screen === "detail" && currentEmail && interactionId !== null && openedAt !== null && (
        <EmailDetailScreen
          email={currentEmail}
          interactionId={interactionId}
          openedAt={openedAt}
          onComplete={handleEmailComplete}
        />
      )}
      {screen === "debrief" && <DebriefScreen />}
    </>
  );
}

export default App;

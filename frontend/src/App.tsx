import { useMemo, useState } from "react";
import "./App.css";
import { ConsentScreen } from "./screens/ConsentScreen";
import { InstructionsScreen } from "./screens/InstructionsScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { EmailDetailScreen } from "./screens/EmailDetailScreen";
import { DebriefScreen } from "./screens/DebriefScreen";
import { openInteraction, startSession } from "./api";
import { useMouseLogger } from "./hooks/useMouseLogger";
import { useKeystrokeLogger } from "./hooks/useKeystrokeLogger";
import type { DummyEmail } from "./types";

// Step 1: single hardcoded dummy email. Step 3 replaces this with the
// full 8-12 email set loaded from a JSON config file.
const DUMMY_EMAILS: DummyEmail[] = [
  {
    id: "dummy_001",
    sender: "IT Support <it-support@company-secure-verify.com>",
    subject: "Urgent: Verify Your Account Within 24 Hours",
    body:
      "Dear Employee,\n\nWe've detected unusual activity on your account. " +
      "Please verify your credentials immediately by clicking the link " +
      "below to avoid suspension.\n\nThank you,\nIT Support Team",
    link: "http://company-secure-verify.com/verify-account",
  },
];

type Screen = "consent" | "instructions" | "inbox" | "detail" | "debrief";

function App() {
  const [screen, setScreen] = useState<Screen>("consent");
  const [participantId] = useState<string>(() => crypto.randomUUID());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<DummyEmail | null>(null);
  const [interactionId, setInteractionId] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);

  useMouseLogger(sessionStarted ? participantId : null);
  useKeystrokeLogger(sessionStarted ? participantId : null);

  const emails = useMemo(() => DUMMY_EMAILS, []);

  const handleBegin = async () => {
    const sessionStartTs = Date.now();
    await startSession(participantId, sessionStartTs);
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
    // Step 1: only one email, go straight to debrief.
    // Step 3 will advance to the next email in the set instead.
    setScreen("debrief");
  };

  return (
    <>
      {screen === "consent" && <ConsentScreen onAccept={() => setScreen("instructions")} />}
      {screen === "instructions" && <InstructionsScreen onBegin={handleBegin} />}
      {screen === "inbox" && <InboxScreen emails={emails} onOpenEmail={handleOpenEmail} />}
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

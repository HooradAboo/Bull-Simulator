import { useRef, useState } from "react";
import "./mail.css";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { Ribbon } from "./Ribbon";
import { FolderSidebar } from "./FolderSidebar";
import { EmailListPane } from "./EmailListPane";
import { ReadingPane } from "./ReadingPane";
import { ConfidenceModal } from "./ConfidenceModal";
import { confirmInteraction, logHover, openInteraction, setConfidence } from "../../api";
import type { ActionType, DummyEmail, FolderName, ProcessedInfo } from "../../types";

type Phase = "idle" | "confidence";

interface Props {
  participantId: string;
  emails: DummyEmail[];
  onAllProcessed: () => void;
}

function folderForAction(action: ActionType | undefined): FolderName {
  if (action === "delete") return "deleted";
  return "inbox";
}

export function MailClientScreen({ participantId, emails, onAllProcessed }: Props) {
  const [selectedEmail, setSelectedEmail] = useState<DummyEmail | null>(null);
  const [interactionId, setInteractionId] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [confidenceValue, setConfidenceValueState] = useState(50);
  const [processed, setProcessed] = useState<Map<string, ProcessedInfo>>(new Map());
  const [currentFolder, setCurrentFolder] = useState<FolderName>("inbox");

  const hoverStart = useRef<number | null>(null);

  const isMidFlow = selectedEmail !== null && !processed.has(selectedEmail.id) && phase !== "idle";

  const folderOf = (emailId: string) => folderForAction(processed.get(emailId)?.action);

  const handleSelectFolder = (folder: FolderName) => {
    if (isMidFlow) return;
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setInteractionId(null);
    setOpenedAt(null);
    setPendingAction(null);
    setPhase("idle");
  };

  const handleSelectEmail = async (email: DummyEmail) => {
    if (isMidFlow) return;

    if (processed.has(email.id)) {
      setSelectedEmail(email);
      setInteractionId(null);
      setOpenedAt(null);
      setPendingAction(null);
      setPhase("idle");
      return;
    }

    const now = Date.now();
    const id = await openInteraction(participantId, email.id, now);
    setSelectedEmail(email);
    setInteractionId(id);
    setOpenedAt(now);
    setPendingAction(null);
    setPhase("idle");
  };

  // Selecting an action commits it immediately (no separate confirm step),
  // so answer_changed is always false - there's no window to revise it.
  const handleSelectAction = async (action: ActionType) => {
    if (!selectedEmail || processed.has(selectedEmail.id) || phase === "confidence") return;
    if (interactionId === null || openedAt === null) return;
    const confirmedAt = Date.now();
    const timeToDecisionMs = confirmedAt - openedAt;
    await confirmInteraction(interactionId, action, false, confirmedAt, timeToDecisionMs);
    setPendingAction(action);
    setPhase("confidence");
    setConfidenceValueState(50);
  };

  const handleSubmitConfidence = async () => {
    if (!selectedEmail || !pendingAction || interactionId === null) return;
    await setConfidence(interactionId, confidenceValue);

    const updated = new Map(processed);
    updated.set(selectedEmail.id, { action: pendingAction, confidence: confidenceValue });
    setProcessed(updated);
    setPhase("idle");

    // If the action moved the email to a different folder (e.g. delete),
    // it's no longer part of the folder we're currently viewing.
    if (folderForAction(pendingAction) !== currentFolder) {
      setSelectedEmail(null);
    }

    if (updated.size >= emails.length) {
      onAllProcessed();
    }
  };

  const handleLinkHoverStart = () => {
    hoverStart.current = Date.now();
  };

  const handleLinkHoverEnd = () => {
    if (hoverStart.current === null || interactionId === null || !selectedEmail) return;
    const start = hoverStart.current;
    hoverStart.current = null;
    logHover(interactionId, selectedEmail.link ?? "", start, Date.now()).catch((err) =>
      console.error("hover log failed", err)
    );
  };

  const processedInfo = selectedEmail ? processed.get(selectedEmail.id) ?? null : null;
  const ribbonDisabled =
    !selectedEmail || processed.has(selectedEmail.id) || phase === "confidence";
  const visibleEmails = emails.filter((e) => folderOf(e.id) === currentFolder);
  const deletedCount = emails.filter((e) => folderOf(e.id) === "deleted").length;

  return (
    <div className="mail-shell">
      <TopBar />
      <TabBar />
      <Ribbon pendingAction={pendingAction} disabled={ribbonDisabled} onSelectAction={handleSelectAction} />
      <div className="mail-body">
        <FolderSidebar
          currentFolder={currentFolder}
          deletedCount={deletedCount}
          onSelectFolder={handleSelectFolder}
        />
        <EmailListPane
          folder={currentFolder}
          emails={visibleEmails}
          selectedId={selectedEmail?.id ?? null}
          processed={processed}
          onSelect={handleSelectEmail}
        />
        <ReadingPane
          email={selectedEmail}
          processedInfo={processedInfo}
          onLinkClick={() => handleSelectAction("click_link")}
          onLinkHoverStart={handleLinkHoverStart}
          onLinkHoverEnd={handleLinkHoverEnd}
        />
      </div>

      {phase === "confidence" && (
        <ConfidenceModal
          confidenceValue={confidenceValue}
          onConfidenceChange={setConfidenceValueState}
          onSubmit={handleSubmitConfidence}
        />
      )}
    </div>
  );
}

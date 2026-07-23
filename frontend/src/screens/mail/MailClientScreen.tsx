import { useEffect, useRef, useState } from "react";
import "./mail.css";
import { useBrowserTabs } from "../browser/BrowserChrome";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { Ribbon } from "./Ribbon";
import { FolderSidebar } from "./FolderSidebar";
import { EmailListPane } from "./EmailListPane";
import { ReadingPane } from "./ReadingPane";
import { ConfidenceModal } from "./ConfidenceModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { RequirementNoticeModal } from "./RequirementNoticeModal";
import { SentItemsPane } from "./SentItemsPane";
import { SentItemReadingPane } from "./SentItemReadingPane";
import { ChangePasswordPrompt } from "../login/ChangePasswordPrompt";
import { ChangePasswordForm } from "../login/ChangePasswordForm";
import { extractEmail } from "./avatar";
import {
  confirmInteraction,
  logHover,
  openInteraction,
  submitInteractionRatings,
  updateCredentialPassword,
  type PerceivedLegitimacy,
} from "../../api";
import { useTaskProgress } from "../../taskProgress";
import type {
  ActionType,
  Contact,
  DummyEmail,
  FolderName,
  ProcessedInfo,
  SentItem,
  TaskConfig,
} from "../../types";

type Phase = "idle" | "confirming" | "forwarding" | "replying" | "link-open" | "confidence";

type PasswordStep = "ask" | "form" | "done";

interface Props {
  participantId: string;
  participantEmail: string;
  credentialId: number;
  emails: DummyEmail[];
  contacts: Contact[];
  tasks: TaskConfig[];
  onAllProcessed: () => void;
}

function folderForAction(action: ActionType | undefined): FolderName {
  if (action === "delete") return "deleted";
  if (action === "report_phishing") return "junk";
  return "inbox";
}

const ACTION_LABELS: Record<ActionType, string> = {
  click_link: "Click a link",
  open_attachment: "Open an attachment",
  reply: "Reply",
  forward: "Forward",
  report_phishing: "Report as Phishing",
  delete: "Delete",
  ignore: "Mark as read",
};

export function MailClientScreen({
  participantId,
  participantEmail,
  credentialId,
  emails,
  contacts,
  tasks,
  onAllProcessed,
}: Props) {
  // Mounting this screen means login just succeeded, so the change-password
  // prompt opens on top of the inbox right away instead of on the login page.
  const [passwordStep, setPasswordStep] = useState<PasswordStep>("ask");
  const [selectedEmail, setSelectedEmail] = useState<DummyEmail | null>(null);
  const [interactionId, setInteractionId] = useState<number | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ActionType | null>(null);
  const [pendingRecipient, setPendingRecipient] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [perceivedLegitimacy, setPerceivedLegitimacy] = useState<PerceivedLegitimacy | null>(null);
  const [judgmentConfidenceValue, setJudgmentConfidenceValue] = useState(50);
  const [confidenceValue, setConfidenceValueState] = useState(50);
  const [difficultyValue, setDifficultyValue] = useState(3);
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [otherCueText, setOtherCueText] = useState("");
  const [processed, setProcessed] = useState<Map<string, ProcessedInfo>>(new Map());
  const [currentFolder, setCurrentFolder] = useState<FolderName>("inbox");
  const [sentItems, setSentItems] = useState<SentItem[]>([]);
  const [selectedSentItem, setSelectedSentItem] = useState<SentItem | null>(null);
  const [requirementNotice, setRequirementNotice] = useState<string[] | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const hoverStart = useRef<number | null>(null);
  const { openTab, isMailTabActive, triggerDownload } = useBrowserTabs();
  const { reportProgress } = useTaskProgress();

  const isMidFlow = selectedEmail !== null && !processed.has(selectedEmail.id) && phase !== "idle";
  const usedActionTypes = new Set(Array.from(processed.values()).map((p) => p.action));

  // Required action types come from the tasks config (any "action_used"
  // subtask, across all tasks) rather than being hardcoded, so editing
  // config/tasks.json changes what's enforced without a code change.
  const requiredActions = tasks
    .flatMap((t) => t.subtasks)
    .filter((s) => s.type === "action_used" && s.action)
    .map((s) => s.action as ActionType);

  useEffect(() => {
    reportProgress({
      processedCount: processed.size,
      totalEmails: emails.length,
      usedActions: usedActionTypes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processed, emails.length]);

  // If choosing this action would leave more required action types unused
  // than there are remaining emails to use them on, it's about to become
  // impossible to finish the task list - reject it instead of committing.
  const computeBlockedNotice = (action: ActionType): string[] | null => {
    if (!selectedEmail) return null;
    const remainingOtherEmails = emails.filter(
      (e) => e.id !== selectedEmail.id && !processed.has(e.id)
    ).length;
    const usedAfter = new Set(usedActionTypes);
    usedAfter.add(action);
    const stillNeeded = requiredActions.filter((a) => !usedAfter.has(a));
    if (stillNeeded.length > remainingOtherEmails) {
      return stillNeeded.map((a) => ACTION_LABELS[a]);
    }
    return null;
  };

  // Clicking a link opens a new browser tab instead of committing
  // immediately; the click_link action only commits once the
  // participant comes back (switches to or closes back into the mail
  // tab), so time_to_decision includes however long they spent there.
  useEffect(() => {
    if (phase === "link-open" && isMailTabActive) {
      commitAction("click_link", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMailTabActive, phase]);

  const folderOf = (emailId: string) => folderForAction(processed.get(emailId)?.action);

  const handleSelectFolder = (folder: FolderName) => {
    if (isMidFlow) return;
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setSelectedSentItem(null);
    setInteractionId(null);
    setOpenedAt(null);
    setPendingAction(null);
    setPhase("idle");
  };

  const handleTogglePin = (emailId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
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

  // Most actions commit immediately (no separate confirm step), so
  // answer_changed is always false - there's no window to revise them.
  // Delete/Report ask for a yes/no confirmation first since they're
  // destructive (move the email out of Inbox). Forward and Reply need
  // more input first (a recipient, or a composed reply), so they open
  // a modal and only commit once that's submitted. Click Link opens a
  // new browser tab and defers committing until the participant returns.
  const handleSelectAction = (action: ActionType) => {
    if (!selectedEmail || processed.has(selectedEmail.id) || phase !== "idle") return;

    const blocked = computeBlockedNotice(action);
    if (blocked) {
      setRequirementNotice(blocked);
      return;
    }

    if (action === "click_link") {
      if (!selectedEmail.link) return;
      openTab(selectedEmail.link);
      setPhase("link-open");
      return;
    }
    if (action === "open_attachment") {
      if (!selectedEmail.attachment) return;
      triggerDownload(selectedEmail.attachment);
      commitAction("open_attachment", null);
      return;
    }
    if (action === "delete" || action === "report_phishing") {
      setConfirmingAction(action);
      setPhase("confirming");
      return;
    }
    if (action === "forward") {
      setPhase("forwarding");
      return;
    }
    if (action === "reply") {
      setPhase("replying");
      return;
    }

    commitAction(action, null);
  };

  const handleConfirmDestructiveAction = () => {
    if (!confirmingAction) return;
    commitAction(confirmingAction, null);
    setConfirmingAction(null);
  };

  const handleCancelDestructiveAction = () => {
    setConfirmingAction(null);
    setPhase("idle");
  };

  const commitAction = async (
    action: ActionType,
    recipient: string | null,
    composedBody?: string
  ) => {
    if (!selectedEmail || interactionId === null || openedAt === null) return;
    const confirmedAt = Date.now();
    const timeToDecisionMs = confirmedAt - openedAt;
    await confirmInteraction(interactionId, action, false, confirmedAt, timeToDecisionMs, recipient);
    setPendingAction(action);
    setPendingRecipient(recipient);
    setPhase("confidence");
    setPerceivedLegitimacy(null);
    setJudgmentConfidenceValue(50);
    setConfidenceValueState(50);
    setDifficultyValue(3);
    setSelectedCues([]);
    setOtherCueText("");

    if (action === "forward" && recipient) {
      const note = composedBody ? `${composedBody}\n\n` : "";
      const body = `${note}---------- Forwarded message ----------\nFrom: ${selectedEmail.sender}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
      setSentItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          originalEmailId: selectedEmail.id,
          kind: "forward",
          subject: `FW: ${selectedEmail.subject}`,
          body,
          originalSender: selectedEmail.sender,
          link: selectedEmail.link,
          attachment: selectedEmail.attachment,
          recipient,
          sentAt: confirmedAt,
        },
      ]);
    }

    if (action === "reply" && recipient && composedBody !== undefined) {
      const quotedBody = `${composedBody}\n\n---------- Original message ----------\nFrom: ${selectedEmail.sender}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
      setSentItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          originalEmailId: selectedEmail.id,
          kind: "reply",
          subject: `RE: ${selectedEmail.subject}`,
          body: quotedBody,
          originalSender: selectedEmail.sender,
          link: null,
          attachment: null,
          recipient,
          sentAt: confirmedAt,
        },
      ]);
    }
  };

  const handleForwardSubmit = (recipient: string, note: string) => {
    commitAction("forward", recipient, note.length > 0 ? note : undefined);
  };

  const handleForwardCancel = () => {
    setPhase("idle");
  };

  const handleReplySubmit = (body: string) => {
    if (!selectedEmail) return;
    commitAction("reply", extractEmail(selectedEmail.sender), body);
  };

  const handleReplyCancel = () => {
    setPhase("idle");
  };

  const handleToggleCue = (cueKey: string) => {
    setSelectedCues((prev) =>
      prev.includes(cueKey) ? prev.filter((c) => c !== cueKey) : [...prev, cueKey]
    );
  };

  const handleSubmitConfidence = async () => {
    if (!selectedEmail || !pendingAction || interactionId === null || !perceivedLegitimacy) return;
    await submitInteractionRatings(interactionId, {
      perceivedLegitimacy,
      judgmentConfidenceRating: judgmentConfidenceValue,
      confidenceRating: confidenceValue,
      difficultyRating: difficultyValue,
      cuesNoticed: selectedCues,
      cuesOtherText: selectedCues.includes("other") ? otherCueText : null,
    });

    const updated = new Map(processed);
    updated.set(selectedEmail.id, {
      action: pendingAction,
      confidence: confidenceValue,
      recipient: pendingRecipient,
    });
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
    !selectedEmail || processed.has(selectedEmail.id) || phase !== "idle";
  const visibleEmails = emails
    .filter((e) => folderOf(e.id) === currentFolder)
    .sort((a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)));
  const deletedCount = emails.filter((e) => folderOf(e.id) === "deleted").length;
  const junkCount = emails.filter((e) => folderOf(e.id) === "junk").length;
  const unreadInboxCount = emails.filter(
    (e) => folderOf(e.id) === "inbox" && !processed.has(e.id)
  ).length;

  return (
    <div className="mail-shell">
      <TopBar participantEmail={participantEmail} />
      <TabBar />
      <Ribbon pendingAction={pendingAction} disabled={ribbonDisabled} onSelectAction={handleSelectAction} />
      <div className="mail-body">
        <FolderSidebar
          currentFolder={currentFolder}
          unreadCount={unreadInboxCount}
          deletedCount={deletedCount}
          junkCount={junkCount}
          sentCount={sentItems.length}
          participantEmail={participantEmail}
          tasks={tasks}
          onSelectFolder={handleSelectFolder}
        />
        {currentFolder === "sent" ? (
          <>
            <SentItemsPane
              sentItems={sentItems}
              selectedId={selectedSentItem?.id ?? null}
              onSelect={setSelectedSentItem}
            />
            <SentItemReadingPane item={selectedSentItem} />
          </>
        ) : (
          <>
            <EmailListPane
              folder={currentFolder}
              emails={visibleEmails}
              selectedId={selectedEmail?.id ?? null}
              processed={processed}
              pinnedIds={pinnedIds}
              onSelect={handleSelectEmail}
              onTogglePin={handleTogglePin}
            />
            <ReadingPane
              email={selectedEmail}
              processedInfo={processedInfo}
              replyMode={phase === "replying"}
              forwardMode={phase === "forwarding"}
              contacts={contacts}
              participantEmail={participantEmail}
              onLinkClick={() => handleSelectAction("click_link")}
              onLinkHoverStart={handleLinkHoverStart}
              onLinkHoverEnd={handleLinkHoverEnd}
              onAttachmentClick={() => handleSelectAction("open_attachment")}
              onReplySubmit={handleReplySubmit}
              onReplyDiscard={handleReplyCancel}
              onForwardSubmit={handleForwardSubmit}
              onForwardDiscard={handleForwardCancel}
            />
          </>
        )}
      </div>

      {requirementNotice && (
        <RequirementNoticeModal
          neededLabels={requirementNotice}
          onDismiss={() => setRequirementNotice(null)}
        />
      )}

      {phase === "confirming" && confirmingAction && (
        <ConfirmActionModal
          action={confirmingAction}
          onConfirm={handleConfirmDestructiveAction}
          onCancel={handleCancelDestructiveAction}
        />
      )}

      {phase === "confidence" && (
        <ConfidenceModal
          perceivedLegitimacy={perceivedLegitimacy}
          onPerceivedLegitimacyChange={setPerceivedLegitimacy}
          judgmentConfidenceValue={judgmentConfidenceValue}
          onJudgmentConfidenceChange={setJudgmentConfidenceValue}
          actionLabel={pendingAction ? ACTION_LABELS[pendingAction] : ""}
          confidenceValue={confidenceValue}
          onConfidenceChange={setConfidenceValueState}
          difficultyValue={difficultyValue}
          onDifficultyChange={setDifficultyValue}
          selectedCues={selectedCues}
          onToggleCue={handleToggleCue}
          otherCueText={otherCueText}
          onOtherCueTextChange={setOtherCueText}
          onSubmit={handleSubmitConfidence}
        />
      )}

      {passwordStep === "ask" && (
        <ChangePasswordPrompt
          onYes={() => setPasswordStep("form")}
          onNo={() => setPasswordStep("done")}
        />
      )}

      {passwordStep === "form" && (
        <ChangePasswordForm
          onCancel={() => setPasswordStep("done")}
          onSubmit={async (newPassword) => {
            await updateCredentialPassword(credentialId, newPassword);
            setPasswordStep("done");
          }}
        />
      )}
    </div>
  );
}

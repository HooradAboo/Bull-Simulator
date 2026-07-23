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
import { VerifyChannelModal } from "./VerifyChannelModal";
import { RequirementNoticeModal } from "./RequirementNoticeModal";
import { SentItemsPane } from "./SentItemsPane";
import { SentItemReadingPane } from "./SentItemReadingPane";
import { DraftsPane } from "./DraftsPane";
import { ChangePasswordPrompt } from "../login/ChangePasswordPrompt";
import { ChangePasswordForm } from "../login/ChangePasswordForm";
import { extractEmail, senderName } from "./avatar";
import {
  confirmInteraction,
  logComposedEmail,
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

type Phase =
  | "idle"
  | "confirming"
  | "forwarding"
  | "replying"
  | "link-open"
  | "verifying"
  | "confidence";

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
  verify_independently: "Verify Independently",
};

const ALL_ACTIONS: ActionType[] = [
  "click_link",
  "open_attachment",
  "reply",
  "forward",
  "report_phishing",
  "delete",
  "ignore",
  "verify_independently",
];

const CUE_KEYS = [
  "sender",
  "subject_line",
  "links",
  "attachments",
  "wording_tone",
  "urgency",
  "personal_info_request",
  "spelling_grammar",
  "branding_logo",
];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function actionIsValidFor(action: ActionType, email: DummyEmail): boolean {
  if (action === "click_link") return !!email.link;
  if (action === "open_attachment") return !!email.attachment;
  return true;
}

function pickRandomAction(email: DummyEmail): ActionType {
  return randomOf(ALL_ACTIONS.filter((a) => actionIsValidFor(a, email)));
}

// Guarantees every action type gets used at least once (subject to
// per-email constraints like needing a link/attachment) rather than
// leaving that to chance, then fills the rest of the emails randomly.
function assignRandomActions(
  emails: DummyEmail[],
  alreadyUsed: Set<ActionType>
): Map<string, ActionType> {
  const shuffled = [...emails].sort(() => Math.random() - 0.5);
  const assignments = new Map<string, ActionType>();
  const claimed = new Set<string>();

  for (const action of ALL_ACTIONS) {
    if (alreadyUsed.has(action)) continue;
    const candidate = shuffled.find((e) => !claimed.has(e.id) && actionIsValidFor(action, e));
    if (candidate) {
      assignments.set(candidate.id, action);
      claimed.add(candidate.id);
    }
  }

  for (const email of shuffled) {
    if (!assignments.has(email.id)) {
      assignments.set(email.id, pickRandomAction(email));
    }
  }

  return assignments;
}

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
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
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
    if (isMidFlow || composeOpen) return;

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
    if (action === "verify_independently") {
      setPendingAction(action);
      setPhase("verifying");
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

  const handleVerifyContinue = () => {
    commitAction("verify_independently", null);
  };

  const handleStartCompose = () => {
    setComposeRecipient("");
    setComposeSubject("");
    setComposeBody("");
    setComposeOpen(true);
  };

  // Composing a fresh message isn't a graded action on any particular
  // email - it's just an outlet participants can use if they want to reach
  // out (e.g. to IT or the sender), so it's only logged, not scored. Still
  // lands in Sent Items so the inbox stays internally consistent.
  const handleComposeSend = async () => {
    const recipient = composeRecipient.trim();
    const subject = composeSubject.trim();
    const body = composeBody.trim();
    const sentAt = Date.now();
    await logComposedEmail(participantId, recipient, subject, body, sentAt);
    setSentItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        originalEmailId: "",
        kind: "compose",
        subject,
        body,
        originalSender: "",
        link: null,
        attachment: null,
        recipient,
        sentAt,
      },
    ]);
    setComposeOpen(false);
  };

  const handleComposeDiscard = () => {
    setComposeOpen(false);
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

  // Dev convenience only (import.meta.env.DEV is false in a built/packaged
  // app, so this never runs in a real study session): auto-processes every
  // remaining email with randomized (not just "mark as read") actions and
  // confidence/difficulty ratings, guaranteeing every action type is used
  // at least once, so the debrief report has varied, realistic-looking
  // data to check without manually clicking through the whole inbox.
  const handleDevSkipAllEmails = async () => {
    const remaining = emails.filter((e) => !processed.has(e.id));
    const alreadyUsed = new Set(Array.from(processed.values()).map((p) => p.action));
    const assignments = assignRandomActions(remaining, alreadyUsed);

    const updated = new Map(processed);
    for (const email of remaining) {
      const action = assignments.get(email.id)!;
      const recipient =
        action === "reply" || action === "forward"
          ? contacts.length > 0
            ? randomOf(contacts).email
            : "someone@example.com"
          : null;

      const openedAt = Date.now();
      const id = await openInteraction(participantId, email.id, openedAt);
      const confirmedAt = Date.now();
      await confirmInteraction(id, action, false, confirmedAt, confirmedAt - openedAt, recipient);

      const numCues = Math.floor(Math.random() * 3);
      const cuesNoticed = [...CUE_KEYS].sort(() => Math.random() - 0.5).slice(0, numCues);
      const confidence = Math.floor(Math.random() * 101);

      await submitInteractionRatings(id, {
        perceivedLegitimacy: Math.random() < 0.5 ? "trust" : "suspicious",
        judgmentConfidenceRating: Math.floor(Math.random() * 101),
        confidenceRating: confidence,
        difficultyRating: 1 + Math.floor(Math.random() * 5),
        cuesNoticed,
        cuesOtherText: null,
      });

      updated.set(email.id, { action, confidence, recipient });
    }
    setProcessed(updated);
    onAllProcessed();
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
      {import.meta.env.DEV && (
        <button className="dev-skip-button" onClick={handleDevSkipAllEmails}>
          DEV: Skip Remaining Emails (random)
        </button>
      )}
      <TopBar participantEmail={participantEmail} />
      <TabBar />
      <Ribbon
        pendingAction={pendingAction}
        disabled={ribbonDisabled}
        composeDisabled={phase !== "idle"}
        onSelectAction={handleSelectAction}
        onCompose={handleStartCompose}
      />
      <div className="mail-body">
        <FolderSidebar
          currentFolder={currentFolder}
          unreadCount={unreadInboxCount}
          deletedCount={deletedCount}
          junkCount={junkCount}
          sentCount={sentItems.length}
          draftsCount={composeOpen ? 1 : 0}
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
        ) : currentFolder === "drafts" ? (
          <>
            <DraftsPane
              hasDraft={composeOpen}
              recipient={composeRecipient}
              subject={composeSubject}
              onSelect={() => setComposeOpen(true)}
            />
            <ReadingPane
              email={null}
              processedInfo={null}
              replyMode={false}
              forwardMode={false}
              composeMode={composeOpen}
              contacts={contacts}
              participantEmail={participantEmail}
              onLinkClick={() => {}}
              onLinkHoverStart={() => {}}
              onLinkHoverEnd={() => {}}
              onAttachmentClick={() => {}}
              onReplySubmit={() => {}}
              onReplyDiscard={() => {}}
              onForwardSubmit={() => {}}
              onForwardDiscard={() => {}}
              composeRecipient={composeRecipient}
              onComposeRecipientChange={setComposeRecipient}
              composeSubject={composeSubject}
              onComposeSubjectChange={setComposeSubject}
              composeBody={composeBody}
              onComposeBodyChange={setComposeBody}
              onComposeSend={handleComposeSend}
              onComposeDiscard={handleComposeDiscard}
            />
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
              composeMode={composeOpen}
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
              composeRecipient={composeRecipient}
              onComposeRecipientChange={setComposeRecipient}
              composeSubject={composeSubject}
              onComposeSubjectChange={setComposeSubject}
              composeBody={composeBody}
              onComposeBodyChange={setComposeBody}
              onComposeSend={handleComposeSend}
              onComposeDiscard={handleComposeDiscard}
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

      {phase === "verifying" && selectedEmail && (
        <VerifyChannelModal
          senderName={senderName(selectedEmail.sender)}
          onContinue={handleVerifyContinue}
          onCancel={() => setPhase("idle")}
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

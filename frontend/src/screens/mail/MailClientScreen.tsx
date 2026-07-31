import { useEffect, useRef, useState } from "react";
import "./mail.css";
import { useBrowserTabs } from "../browser/BrowserChrome";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { Ribbon } from "./Ribbon";
import { FolderSidebar } from "./FolderSidebar";
import { EmailListPane } from "./EmailListPane";
import { ReadingPane } from "./ReadingPane";
import type { JudgmentStep } from "./JudgmentPanel";
import { ConfidenceModal } from "./ConfidenceModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { ActionRecordedModal } from "./ActionRecordedModal";
import { SentItemsPane } from "./SentItemsPane";
import { SentItemReadingPane } from "./SentItemReadingPane";
import { DraftsPane } from "./DraftsPane";
import { HelpButton } from "./HelpButton";
import { extractEmail, senderName } from "./avatar";
import {
  confirmInteraction,
  logComposedEmail,
  logHover,
  openInteraction,
  submitInteractionRatings,
  type PerceivedLegitimacy,
} from "../../api";
import type {
  ActionType,
  Contact,
  DummyEmail,
  FolderName,
  ProcessedInfo,
  SentItem,
} from "../../types";

type Phase =
  | "idle"
  | "confirming"
  | "forwarding"
  | "replying"
  | "action-recorded"
  | "verifying"
  | "confidence";

interface Props {
  participantId: string;
  participantEmail: string;
  emails: DummyEmail[];
  contacts: Contact[];
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

// Mirrors ConfidenceModal's per-action reason groups, kept as a flat lookup
// here since the DEV skip-all path fills ratings directly via the API
// without ever rendering the modal itself.
const ACTION_REASON_KEYS: Record<ActionType, string[]> = {
  delete: ["unfamiliar_sender", "asked_for_info", "urgent_pressure", "wording_off", "distrust_link_attachment"],
  report_phishing: ["unfamiliar_sender", "asked_for_info", "urgent_pressure", "wording_off", "distrust_link_attachment"],
  reply: ["trusted_sender", "reasonable_request", "curious", "relevant", "needed_info"],
  forward: ["trusted_sender", "reasonable_request", "curious", "relevant", "needed_info"],
  click_link: ["trusted_sender", "reasonable_request", "curious", "relevant", "needed_info"],
  open_attachment: ["trusted_sender", "reasonable_request", "curious", "relevant", "needed_info"],
  ignore: ["unsure", "not_urgent", "deal_later", "legit_no_response"],
  verify_independently: ["not_sure_legit", "confirm_first", "somewhat_suspicious", "habit_check"],
};

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
  emails,
  contacts,
  onAllProcessed,
}: Props) {
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
  const [judgmentStep, setJudgmentStep] = useState<JudgmentStep>("done");
  const [perceivedLegitimacy, setPerceivedLegitimacy] = useState<PerceivedLegitimacy | null>(null);
  const [judgmentConfidenceValue, setJudgmentConfidenceValue] = useState(3);
  const [confidenceValue, setConfidenceValueState] = useState(3);
  const [difficultyValue, setDifficultyValue] = useState(3);
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [otherCueText, setOtherCueText] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReasonText, setOtherReasonText] = useState("");
  const [processed, setProcessed] = useState<Map<string, ProcessedInfo>>(new Map());
  const [currentFolder, setCurrentFolder] = useState<FolderName>("inbox");
  const [sentItems, setSentItems] = useState<SentItem[]>([]);
  const [selectedSentItem, setSelectedSentItem] = useState<SentItem | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const hoverStart = useRef<number | null>(null);
  const { isMailTabActive, registerIndependentSearchHandler, setIndependentSearchTarget } =
    useBrowserTabs();

  const isMidFlow = selectedEmail !== null && !processed.has(selectedEmail.id) && phase !== "idle";

  // Switching to the Google tab to verify independently doesn't commit
  // immediately - it only commits once the participant comes back to the
  // mail tab, so time_to_decision includes however long they spent there.
  useEffect(() => {
    if (isMailTabActive && phase === "verifying") {
      commitAction("verify_independently", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMailTabActive, phase]);

  // Registers the handler the Google tab calls once the participant submits
  // a search there. Only actually starts the action if nothing else is
  // already in flight for this email (phase idle) - but note this is
  // narrower than the "which email is this" label below: phase moves to
  // "verifying" the instant this fires, so gating the *label* on phase idle
  // too would null it out right as the search succeeds, wiping the Google
  // tab's own "recorded" confirmation before the participant ever sees it.
  const canStartVerifying =
    !!selectedEmail &&
    !processed.has(selectedEmail.id) &&
    phase === "idle" &&
    interactionId !== null &&
    judgmentStep === "done";

  useEffect(() => {
    registerIndependentSearchHandler(() => {
      if (!canStartVerifying) return;
      setPhase("verifying");
    });
    return () => registerIndependentSearchHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStartVerifying]);

  // The Google tab's displayed target: any selected, not-yet-processed email
  // counts, all the way through its verifying/confidence sub-phases - it only
  // clears once that email is actually processed (or a different one opens).
  useEffect(() => {
    setIndependentSearchTarget(
      selectedEmail && !processed.has(selectedEmail.id)
        ? {
            id: selectedEmail.id,
            label: `"${selectedEmail.subject}" from ${senderName(selectedEmail.sender)}`,
          }
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmail, processed]);

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
    setJudgmentStep("done");
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
      setJudgmentStep("done");
      setPerceivedLegitimacy(null);
      return;
    }

    const now = Date.now();
    const id = await openInteraction(participantId, email.id, now);
    setSelectedEmail(email);
    setInteractionId(id);
    setOpenedAt(now);
    setPendingAction(null);
    setPhase("idle");
    setPerceivedLegitimacy(null);
    setJudgmentConfidenceValue(3);
    setJudgmentStep("trust");
  };

  // Most actions commit immediately (no separate confirm step), so
  // answer_changed is always false - there's no window to revise them.
  // Delete/Report ask for a yes/no confirmation first since they're
  // destructive (move the email out of Inbox). Forward and Reply need
  // more input first (a recipient, or a composed reply), so they open
  // a modal and only commit once that's submitted. Click Link and Open
  // Attachment show a "this action has been recorded" popup first
  // (rather than actually opening a tab or download) and commit once the
  // participant dismisses it.
  const handleSelectLegitimacy = (value: PerceivedLegitimacy) => {
    setPerceivedLegitimacy(value);
    setJudgmentStep("confidence");
  };

  const handleSelectJudgmentConfidence = (value: number) => {
    setJudgmentConfidenceValue(value);
    setJudgmentStep("done");
  };

  const handleSelectAction = (action: ActionType) => {
    if (
      !selectedEmail ||
      processed.has(selectedEmail.id) ||
      phase !== "idle" ||
      judgmentStep !== "done"
    )
      return;

    if (action === "click_link") {
      if (!selectedEmail.link) return;
      setPendingAction(action);
      setPhase("action-recorded");
      return;
    }
    if (action === "open_attachment") {
      if (!selectedEmail.attachment) return;
      setPendingAction(action);
      setPhase("action-recorded");
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
    setConfidenceValueState(3);
    setDifficultyValue(3);
    setSelectedCues([]);
    setOtherCueText("");
    setSelectedReasons([]);
    setOtherReasonText("");

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

  const handleToggleReason = (reasonKey: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonKey) ? prev.filter((r) => r !== reasonKey) : [...prev, reasonKey]
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
      actionReasons: selectedReasons,
      actionReasonsOtherText: selectedReasons.includes("other") ? otherReasonText : null,
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
      const reasonPool = ACTION_REASON_KEYS[action];
      const numReasons = 1 + Math.floor(Math.random() * 2);
      const actionReasons = [...reasonPool].sort(() => Math.random() - 0.5).slice(0, numReasons);

      await submitInteractionRatings(id, {
        perceivedLegitimacy: Math.random() < 0.5 ? "trust" : "suspicious",
        judgmentConfidenceRating: Math.floor(Math.random() * 101),
        confidenceRating: confidence,
        difficultyRating: 1 + Math.floor(Math.random() * 5),
        cuesNoticed,
        cuesOtherText: null,
        actionReasons,
        actionReasonsOtherText: null,
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
    !selectedEmail ||
    processed.has(selectedEmail.id) ||
    phase !== "idle" ||
    judgmentStep !== "done";
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
      <HelpButton />
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
              judgmentStep="done"
              perceivedLegitimacy={null}
              judgmentConfidenceValue={3}
              onSelectLegitimacy={() => {}}
              onSelectJudgmentConfidence={() => {}}
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
              judgmentStep={judgmentStep}
              perceivedLegitimacy={perceivedLegitimacy}
              judgmentConfidenceValue={judgmentConfidenceValue}
              onSelectLegitimacy={handleSelectLegitimacy}
              onSelectJudgmentConfidence={handleSelectJudgmentConfidence}
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

      {phase === "confirming" && confirmingAction && (
        <ConfirmActionModal
          action={confirmingAction}
          onConfirm={handleConfirmDestructiveAction}
          onCancel={handleCancelDestructiveAction}
        />
      )}

      {phase === "action-recorded" && pendingAction && (
        <ActionRecordedModal onContinue={() => commitAction(pendingAction, null)} />
      )}

      {phase === "confidence" && (
        <ConfidenceModal
          action={pendingAction}
          actionLabel={pendingAction ? ACTION_LABELS[pendingAction] : ""}
          confidenceValue={confidenceValue}
          onConfidenceChange={setConfidenceValueState}
          difficultyValue={difficultyValue}
          onDifficultyChange={setDifficultyValue}
          selectedCues={selectedCues}
          onToggleCue={handleToggleCue}
          otherCueText={otherCueText}
          onOtherCueTextChange={setOtherCueText}
          selectedReasons={selectedReasons}
          onToggleReason={handleToggleReason}
          otherReasonText={otherReasonText}
          onOtherReasonTextChange={setOtherReasonText}
          onSubmit={handleSubmitConfidence}
        />
      )}
    </div>
  );
}

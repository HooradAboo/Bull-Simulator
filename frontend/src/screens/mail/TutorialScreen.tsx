import { useState } from "react";
import "./mail.css";
import "./tutorial.css";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { Ribbon } from "./Ribbon";
import { FolderSidebar } from "./FolderSidebar";
import { EmailListPane } from "./EmailListPane";
import { ReadingPane } from "./ReadingPane";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { ActionRecordedModal } from "./ActionRecordedModal";
import { SentItemsPane } from "./SentItemsPane";
import { SentItemReadingPane } from "./SentItemReadingPane";
import { DraftsPane } from "./DraftsPane";
import { HelpButton } from "./HelpButton";
import type { JudgmentStep } from "./JudgmentPanel";
import { TutorialSpotlight, type TutorialStep } from "./TutorialSpotlight";
import { extractEmail } from "./avatar";
import type { PerceivedLegitimacy } from "../../api";
import type {
  ActionType,
  Contact,
  DummyEmail,
  FolderName,
  ProcessedInfo,
  SentItem,
} from "../../types";

type Phase = "idle" | "confirming" | "forwarding" | "replying" | "action-recorded";

interface Props {
  onFinish: () => void;
}

const PRACTICE_EMAIL = "you@usf.edu";

const EMPTY_PINNED_IDS = new Set<string>();

function folderForAction(action: ActionType | undefined): FolderName {
  if (action === "delete") return "deleted";
  if (action === "report_phishing") return "junk";
  return "inbox";
}

const PRACTICE_CONTACTS: Contact[] = [
  { name: "USF IT Help Desk", email: "ithelp@usf.edu" },
  { name: "Jordan Lee", email: "jordan.lee@usf.edu" },
];

// Fake, throwaway content - deliberately unrelated to the real study emails
// so nothing here hints at what a real phishing/legit email looks like.
// practice-1 carries both a link and an attachment so it can stay open for
// the whole guided tour, including the Click Link / Open Attachment steps.
const PRACTICE_EMAILS: DummyEmail[] = [
  {
    id: "practice-1",
    sender: "Jordan Lee <jordan.lee@usf.edu>",
    subject: "Welcome to your practice inbox",
    body: "Hi there,\n\nThis is a practice email so you can get comfortable with the toolbar above before the real task begins. Nothing you do here counts, and there's nothing to answer afterward.\n\nThere's a link and an attachment below so you can try those actions too, whenever you're ready.",
    link: "https://intranet.example.edu/practice-page",
    attachment: "practice-notes.pdf",
    receivedAt: Date.now(),
  },
  {
    id: "practice-2",
    sender: "Jordan Lee <jordan.lee@usf.edu>",
    subject: "Lunch on Thursday?",
    body: "Hey,\n\nA few of us are grabbing lunch Thursday around noon, want to join? Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\nLet me know!",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "practice-3",
    sender: "Jordan Lee <jordan.lee@usf.edu>",
    subject: "Reminder: timesheet due Friday",
    body: "Hi,\n\nJust a reminder to submit your timesheet by end of day Friday. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.\n\nThanks!",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60 * 2,
  },
];

const TOUR_STEPS: TutorialStep[] = [
  {
    key: "intro",
    title: "Welcome to the Practice Round",
    description:
      "Below is a simulated inbox, styled just like the one you'll use for the real task. Before you try anything yourself, we'll walk you through each of the actions available in the toolbar above - nothing you do in this practice round counts, and there's nothing to answer afterward.",
    targetSelector: null,
  },
  {
    key: "task-explainer",
    title: "What You'll Be Doing",
    description:
      "In the real task, you'll go through your inbox one email at a time - read each one, decide how you'd respond to it, and then take the action that fits, using the toolbar above.",
    targetSelector: null,
  },
  {
    key: "email-list",
    title: "Your Inbox",
    description:
      "Each row here is an email waiting for a response. Click one to read it, then use the toolbar above to act on it.",
    targetSelector: ".mail-list-pane",
  },
  {
    key: "unread-count",
    title: "Finishing the Task",
    description:
      "This number shows how many emails still need a response. The task isn't finished until you've taken an action on every email in your inbox.",
    targetSelector: ".mail-list-header .count",
  },
  {
    key: "judgment",
    title: "Before You Act, Judge It",
    description:
      "Before you can take any action on an email, you'll be asked whether you trust it or find it suspicious, and how confident you are in that call. The toolbar stays locked until you've answered both.",
    targetSelector: ".judgment-panel",
  },
  {
    key: "all-actions",
    title: "Your Actions",
    description: "These are your 8 actions - we'll go through each one next.",
    targetSelector: [
      '[data-tour="delete"]',
      '[data-tour="report_phishing"]',
      '[data-tour="reply"]',
      '[data-tour="forward"]',
      '[data-tour="ignore"]',
      '[data-tour="verify_independently"]',
    ],
  },
  {
    key: "email-actions",
    title: "Two More, Inside the Email",
    description:
      "Not every action lives in the toolbar - clicking a link or opening an attachment happens right inside the email itself, like the two highlighted below.",
    targetSelector: ['[data-tour="click_link"]', '[data-tour="open_attachment"]'],
  },
  {
    key: "delete",
    title: "Delete",
    description: "Moves the email to Deleted Items.",
    targetSelector: '[data-tour="delete"]',
  },
  {
    key: "report_phishing",
    title: "Report as Phishing",
    description: "Flags the email as phishing and moves it to Junk Email.",
    targetSelector: '[data-tour="report_phishing"]',
  },
  {
    key: "reply",
    title: "Reply",
    description: "Sends a response straight back to whoever sent the email.",
    targetSelector: '[data-tour="reply"]',
  },
  {
    key: "forward",
    title: "Forward",
    description: "Sends the email on to someone else, like a colleague or IT.",
    targetSelector: '[data-tour="forward"]',
  },
  {
    key: "ignore",
    title: "Mark as Read",
    description: "Dismisses the email without taking any other action on it.",
    targetSelector: '[data-tour="ignore"]',
  },
  {
    key: "verify_independently",
    title: "Verify Independently",
    description:
      "Use this when you'd want to double-check something outside of email - for example, calling the sender directly instead of replying.",
    targetSelector: '[data-tour="verify_independently"]',
  },
  {
    key: "open_attachment",
    title: "Opening an Attachment",
    description:
      "Attachments work the same way - opening one is recorded, but nothing actually downloads.",
    targetSelector: '[data-tour="open_attachment"]',
  },
  {
    key: "click_link",
    title: "Clicking a Link",
    description:
      "Links in this study are simulated - clicking one just records that you clicked it. It never opens a real page.",
    targetSelector: '[data-tour="click_link"]',
  },
  {
    key: "one-action-only",
    title: "One Action, No Going Back",
    description:
      "In the real task, you can only take one action per email - once you pick one, it's final. There's no undo and no second choice, so take your time and be sure before you click.",
    targetSelector: null,
  },
];

export function TutorialScreen({ onFinish }: Props) {
  const [tourActive, setTourActive] = useState(true);

  const [selectedEmail, setSelectedEmail] = useState<DummyEmail | null>(PRACTICE_EMAILS[0]);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ActionType | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [judgmentStep, setJudgmentStep] = useState<JudgmentStep>("trust");
  const [perceivedLegitimacy, setPerceivedLegitimacy] = useState<PerceivedLegitimacy | null>(null);
  const [judgmentConfidenceValue, setJudgmentConfidenceValue] = useState<number | null>(null);
  const [processed, setProcessed] = useState<Map<string, ProcessedInfo>>(new Map());
  const [currentFolder, setCurrentFolder] = useState<FolderName>("inbox");
  const [sentItems, setSentItems] = useState<SentItem[]>([]);
  const [selectedSentItem, setSelectedSentItem] = useState<SentItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const isMidFlow = selectedEmail !== null && !processed.has(selectedEmail.id) && phase !== "idle";

  const handleRestartTutorial = () => {
    setSelectedEmail(PRACTICE_EMAILS[0]);
    setPendingAction(null);
    setConfirmingAction(null);
    setPhase("idle");
    setProcessed(new Map());
    setCurrentFolder("inbox");
    setSentItems([]);
    setSelectedSentItem(null);
    setComposeOpen(false);
    setComposeRecipient("");
    setComposeSubject("");
    setComposeBody("");
    setJudgmentStep("trust");
    setPerceivedLegitimacy(null);
    setJudgmentConfidenceValue(null);
    // Remounts TutorialSpotlight fresh, so its own step index resets to 0.
    setTourActive(true);
  };

  const folderOf = (emailId: string) => folderForAction(processed.get(emailId)?.action);

  const handleSelectFolder = (folder: FolderName) => {
    if (tourActive || isMidFlow) return;
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setSelectedSentItem(null);
    setPhase("idle");
    setJudgmentStep("done");
  };

  const handleSelectEmail = (email: DummyEmail) => {
    if (tourActive || isMidFlow || composeOpen) return;

    if (processed.has(email.id)) {
      setSelectedEmail(email);
      setPendingAction(null);
      setPhase("idle");
      setJudgmentStep("done");
      setPerceivedLegitimacy(null);
      return;
    }

    setSelectedEmail(email);
    setPendingAction(null);
    setPhase("idle");
    setPerceivedLegitimacy(null);
    setJudgmentConfidenceValue(null);
    setJudgmentStep("trust");
  };

  const handleSelectLegitimacy = (value: PerceivedLegitimacy) => {
    setPerceivedLegitimacy(value);
    setJudgmentStep("confidence");
  };

  const handleSelectJudgmentConfidence = (value: number) => {
    setJudgmentConfidenceValue(value);
    setJudgmentStep("done");
  };

  const commitAction = (action: ActionType, recipient: string | null, composedBody?: string) => {
    if (!selectedEmail) return;
    const sentAt = Date.now();

    const updated = new Map(processed);
    updated.set(selectedEmail.id, { action, confidence: null, recipient });
    setProcessed(updated);
    setPendingAction(null);
    setPhase("idle");

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
          sentAt,
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
          sentAt,
        },
      ]);
    }

    if (folderForAction(action) !== currentFolder) {
      setSelectedEmail(null);
    }
  };

  const handleSelectAction = (action: ActionType) => {
    if (
      tourActive ||
      !selectedEmail ||
      processed.has(selectedEmail.id) ||
      phase !== "idle" ||
      judgmentStep !== "done"
    )
      return;

    if (action === "click_link" || action === "open_attachment" || action === "verify_independently") {
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
    if (tourActive) return;
    setComposeRecipient("");
    setComposeSubject("");
    setComposeBody("");
    setComposeOpen(true);
  };

  const handleComposeSend = () => {
    if (composeRecipient.trim().length === 0) return;
    setSentItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        originalEmailId: "",
        kind: "compose",
        subject: composeSubject.trim(),
        body: composeBody.trim(),
        originalSender: "",
        link: null,
        attachment: null,
        recipient: composeRecipient.trim(),
        sentAt: Date.now(),
      },
    ]);
    setComposeOpen(false);
  };

  const handleComposeDiscard = () => setComposeOpen(false);

  const handleConfirmDestructiveAction = () => {
    if (!confirmingAction) return;
    commitAction(confirmingAction, null);
    setConfirmingAction(null);
  };

  const handleCancelDestructiveAction = () => {
    setConfirmingAction(null);
    setPhase("idle");
  };

  const handleForwardSubmit = (recipient: string, note: string) => {
    commitAction("forward", recipient, note.length > 0 ? note : undefined);
  };
  const handleForwardCancel = () => setPhase("idle");

  const handleReplySubmit = (body: string) => {
    if (!selectedEmail) return;
    commitAction("reply", extractEmail(selectedEmail.sender), body);
  };
  const handleReplyCancel = () => setPhase("idle");

  const processedInfo = selectedEmail ? processed.get(selectedEmail.id) ?? null : null;
  const ribbonDisabled =
    tourActive ||
    !selectedEmail ||
    processed.has(selectedEmail.id) ||
    phase !== "idle" ||
    judgmentStep !== "done";
  const visibleEmails = PRACTICE_EMAILS.filter((e) => folderOf(e.id) === currentFolder);
  const deletedCount = PRACTICE_EMAILS.filter((e) => folderOf(e.id) === "deleted").length;
  const junkCount = PRACTICE_EMAILS.filter((e) => folderOf(e.id) === "junk").length;
  const unreadInboxCount = PRACTICE_EMAILS.filter(
    (e) => folderOf(e.id) === "inbox" && !processed.has(e.id)
  ).length;

  return (
    <div className="mail-shell mail-shell-tutorial">
      <HelpButton />
      <TopBar participantEmail={PRACTICE_EMAIL} />
      <TabBar />
      <Ribbon
        pendingAction={pendingAction}
        disabled={ribbonDisabled}
        composeDisabled
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
          participantEmail={PRACTICE_EMAIL}
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
              contacts={PRACTICE_CONTACTS}
              participantEmail={PRACTICE_EMAIL}
              judgmentStep="done"
              perceivedLegitimacy={null}
              judgmentConfidenceValue={null}
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
              pinnedIds={EMPTY_PINNED_IDS}
              onSelect={handleSelectEmail}
              onTogglePin={() => {}}
            />
            <ReadingPane
              email={selectedEmail}
              processedInfo={processedInfo}
              replyMode={phase === "replying"}
              forwardMode={phase === "forwarding"}
              composeMode={composeOpen}
              contacts={PRACTICE_CONTACTS}
              participantEmail={PRACTICE_EMAIL}
              judgmentStep={judgmentStep}
              perceivedLegitimacy={perceivedLegitimacy}
              judgmentConfidenceValue={judgmentConfidenceValue}
              onSelectLegitimacy={handleSelectLegitimacy}
              onSelectJudgmentConfidence={handleSelectJudgmentConfidence}
              onLinkClick={() => handleSelectAction("click_link")}
              onLinkHoverStart={() => {}}
              onLinkHoverEnd={() => {}}
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

      {!tourActive && (
        <>
          <button
            type="button"
            className="tutorial-restart-button"
            onClick={handleRestartTutorial}
          >
            Restart Tutorial
          </button>
          <button type="button" className="tutorial-start-button" onClick={onFinish}>
            Start the Real Task
          </button>
        </>
      )}

      {tourActive && (
        <TutorialSpotlight steps={TOUR_STEPS} onFinish={() => setTourActive(false)} />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import "./mail.css";
import "./tutorial.css";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { Ribbon } from "./Ribbon";
import { FolderSidebar } from "./FolderSidebar";
import { EmailListPane } from "./EmailListPane";
import { ReadingPane } from "./ReadingPane";
import { ConfidenceModal } from "./ConfidenceModal";
import { ConfirmActionModal } from "./ConfirmActionModal";
import { ActionRecordedModal } from "./ActionRecordedModal";
import { SentItemsPane } from "./SentItemsPane";
import { SentItemReadingPane } from "./SentItemReadingPane";
import { DraftsPane } from "./DraftsPane";
import { HelpButton } from "./HelpButton";
import type { JudgmentStep } from "./JudgmentPanel";
import { TutorialSpotlight, type TutorialStep } from "./TutorialSpotlight";
import { GuidedCaption } from "./GuidedCaption";
import { extractEmail } from "./avatar";
import {
  getActionReasons,
  getCueOptions,
  type ActionReasonOption,
  type CueOption,
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
  | "confidence";

interface Props {
  onFinish: () => void;
}

const PRACTICE_EMAIL = "you@usf.edu";

const EMPTY_PINNED_IDS = new Set<string>();

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
    sender: "CIBeR Lab <ciberlab@usf.edu>",
    subject: "Welcome to Your Practice Inbox",
    body: "Hi there,\n\nWelcome to the practice round! This is a simulated email from the CIBeR Lab so you can get comfortable with the toolbar above before the real task begins. Nothing you do here counts, and there's nothing to answer afterward.\n\nThere's a link and an attachment below so you can try those actions too, whenever you're ready.",
    link: "https://intranet.example.edu/practice-page",
    attachment: "practice-notes.pdf",
    receivedAt: Date.now(),
  },
  {
    id: "practice-2",
    sender: "Jane Doe <jane.doe@example.com>",
    subject: "Board game night?",
    body: "Hi,\n\nA few of us are getting together for board game night this weekend. Want to come? Snacks provided.\n\nLet me know!",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "practice-3",
    sender: "John Doe <john.doe@example.com>",
    subject: "Recipe you asked for",
    body: "Hey,\n\nHere's that pasta recipe I mentioned. Let me know how it turns out!\n\nTalk soon.",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "practice-4",
    sender: "Jane Doe <jane.doe@example.com>",
    subject: "Weekend hike?",
    body: "Hi,\n\nThinking about doing the trail out by the lake this weekend if the weather holds. Interested in joining?\n\nCheers.",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "practice-5",
    sender: "John Doe <john.doe@example.com>",
    subject: "Book club pick",
    body: "Hey,\n\nWe landed on the next book club pick. Copies should be at the library by Friday.\n\nSee you there.",
    link: null,
    attachment: null,
    receivedAt: Date.now() - 1000 * 60 * 60 * 4,
  },
];

const TOUR_STEPS: TutorialStep[] = [
  {
    key: "intro",
    title: "Welcome to the Practice Round",
    description:
      "Here's a simulated inbox, styled just like the one you'll use for the real task. Before you try anything, we'll walk through everything so nothing catches you off guard later. Nothing you do here counts.",
    targetSelector: null,
  },
  {
    key: "task-explainer",
    title: "What You'll Be Doing",
    description:
      "In the real task, you'll work through your inbox one email at a time: read it, decide whether you trust it, take the action that fits, then tell us a bit more about your call.",
    targetSelector: null,
  },
  {
    key: "inbox-transition",
    title: "Let's Take a Look Around",
    description:
      "Before we get into how you'll respond to emails, here's a quick look at the inbox itself.",
    targetSelector: null,
  },
  {
    key: "email-list",
    title: "Your Inbox",
    description:
      "Every row here is an email waiting on you. Click one to open it, then use the toolbar above to act on it.",
    targetSelector: ".mail-list-pane",
  },
  {
    key: "unread-count",
    title: "Finishing the Task",
    description:
      "This number tracks how many emails still need a response. You're done when every email in your inbox has been acted on.",
    targetSelector: ".mail-list-header .count",
  },
  {
    key: "all-actions",
    title: "Your Actions",
    description: "Here are your 6 tools for handling an email. We'll walk through what each one does.",
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
      "Not everything lives in the toolbar though. Clicking a link or opening an attachment happens right inside the email itself, and both count as an action.",
    targetSelector: ['[data-tour="click_link"]', '[data-tour="open_attachment"]'],
  },
  {
    key: "action-breakdown-intro",
    title: "Let's Break Them Down",
    description: "Now let's go through each one so you know exactly what it does.",
    targetSelector: null,
  },
  {
    key: "delete",
    title: "Delete",
    description: "Moves the email straight to Deleted Items.",
    targetSelector: '[data-tour="delete"]',
  },
  {
    key: "report_phishing",
    title: "Report as Phishing",
    description: "Flags the email as phishing and sends it to Junk Email.",
    targetSelector: '[data-tour="report_phishing"]',
  },
  {
    key: "reply",
    title: "Reply",
    description: "Sends your response straight back to whoever sent the email.",
    targetSelector: '[data-tour="reply"]',
  },
  {
    key: "forward",
    title: "Forward",
    description: "Passes the email along to someone else, like a colleague or IT.",
    targetSelector: '[data-tour="forward"]',
  },
  {
    key: "ignore",
    title: "Mark as Read",
    description: "Dismisses the email without taking any other action.",
    targetSelector: '[data-tour="ignore"]',
  },
  {
    key: "verify_independently",
    title: "Verify Independently",
    description:
      "Use this when you'd rather check things out yourself first, like searching up the sender before replying.",
    targetSelector: '[data-tour="verify_independently"]',
  },
  {
    key: "click_link",
    title: "Clicking a Link",
    description:
      "Links in this study are simulated. Clicking one just records that you clicked it, it never opens a real page.",
    targetSelector: '[data-tour="click_link"]',
  },
  {
    key: "open_attachment",
    title: "Opening an Attachment",
    description:
      "Attachments work the same way. Opening one counts as an action, but nothing actually downloads.",
    targetSelector: '[data-tour="open_attachment"]',
  },
  {
    key: "one-action-only",
    title: "One Action, No Going Back",
    description:
      "Heads up, you only get one action per email. Once you pick one, it's final. There's no undo and no second chance, so take your time and be sure before you click.",
    targetSelector: null,
  },
  {
    key: "disabled-actions",
    title: "One More Thing",
    description:
      "You'll also notice a few buttons that stay greyed out no matter what. Those aren't part of this study, so they're switched off. Stick to the ones we just covered.",
    targetSelector: ".mail-ribbon"
    // [
    //   '[data-tour="decorative-archive"]',
    //   '[data-tour="decorative-sweep"]',
    //   '[data-tour="decorative-move-to"]',
    //   '[data-tour="decorative-reply-all"]',
    //   '[data-tour="decorative-share-to-teams"]',
    //   '[data-tour="decorative-quick-steps"]',
    // ],
  },
  // {
  //   key: "help-hover",
  //   title: "Forget What Something Does?",
  //   description: "Hover over any button and it'll tell you exactly what it does.",
  //   targetSelector: ".mail-ribbon",
  // },
  {
    key: "help-button",
    title: "Forget What Something Does?",
    description: "Click the help button anytime to see every action laid out in one place.",
    targetSelector: ".help-fab",
  },
  {
    key: "before-after-intro",
    title: "Before You Practice",
    description:
      "Here's what happens right before, and right after, you take action on an email.",
    targetSelector: null,
  },
  {
    key: "judgment",
    title: "Before You Act, Judge It",
    description:
      "Before you can take any action, you'll be asked two quick questions: do you trust this email or find it suspicious, and how confident are you in that call? The toolbar stays locked until you've answered both.",
    targetSelector: ".judgment-panel",
  },
  {
    key: "after-act",
    title: "After You Act",
    description:
      "Once you act, we'll ask a few quick follow-up questions: how confident you were, how difficult the decision felt, what caught your attention, and why you chose that response. It's the same three questions after every email, and it only takes a few seconds.",
    targetSelector: ".confidence-box",
  },
  {
    key: "practice-intro",
    title: "Let's Practice Together",
    description:
      "Time to try it yourself. We'll walk through two emails together before you're on your own.",
    targetSelector: null,
  },
];

const CLOSING_TOUR_STEPS: TutorialStep[] = [
  {
    key: "free-practice",
    title: "Free Practice",
    description:
      "The rest of the practice inbox is yours. Try out anything you just learned, nothing here counts. When you're ready, move on to the real task. You can click Restart Tutorial anytime to run through the tour again.",
    targetSelector: null,
  },
];

const GUIDED_EMAIL_1 = "practice-1";
const GUIDED_EMAIL_2 = "practice-2";
const GUIDED_EMAIL_2_SUBJECT = "Board game night?";

type GuidedStepKey =
  | "email-transition"
  | "email1-open"
  | "email1-judge-trust"
  | "email1-judge-confidence"
  | "email1-action"
  | "email1-followup"
  | "email2-open"
  | "email2-judge-trust"
  | "email2-judge-confidence"
  | "email2-action"
  | "email2-followup";

interface GuidedStepContent {
  stepLabel: string;
  title: string;
  description: string;
  targetSelector: string | string[] | null;
  // Email 1 gets the full dim/highlight spotlight treatment since it's the
  // first time through. Email 2 (and the transition between them) skip
  // that and just show the instruction, so the second pass feels lighter
  // rather than repeating the same heavy walkthrough.
  noSpotlight?: boolean;
}

const GUIDED_STEP_CONTENT: Record<GuidedStepKey, GuidedStepContent> = {
  "email-transition": {
    stepLabel: "Nice Work",
    title: "One Down, One to Go",
    description: "Let's try one more practice email so you get comfortable with the flow.",
    targetSelector: null,
    noSpotlight: true,
  },
  "email1-open": {
    stepLabel: "Email 1 of 2",
    title: "Click on the Email",
    description:
      "Open the email below and answer the trust or suspicious question. Since this is practice, there's no wrong answer, just try it out.",
    targetSelector: `[data-email-id="${GUIDED_EMAIL_1}"]`,
  },
  "email1-judge-trust": {
    stepLabel: "Email 1 of 2",
    title: "Make Your Call",
    description:
      "Answer the trust or suspicious question below. Since this is practice, there's no wrong answer, just try it out.",
    targetSelector: ".judgment-panel",
  },
  "email1-judge-confidence": {
    stepLabel: "Email 1 of 2",
    title: "Rate Your Confidence",
    description: "Now rate how confident you are in that call.",
    targetSelector: ".judgment-panel",
  },
  "email1-action": {
    stepLabel: "Email 1 of 2",
    title: "Open the Attachment",
    description: "For this email, try opening the attachment to see how it works.",
    targetSelector: '[data-tour="open_attachment"]',
  },
  "email1-followup": {
    stepLabel: "Email 1 of 2",
    title: "Tell Us More About Your Action",
    description:
      "Answer these last few questions about the action you just took. You'll see this same set after every email in the real task.",
    targetSelector: ".confidence-box",
  },
  "email2-open": {
    stepLabel: "Email 2 of 2",
    title: "Click on the Email",
    description: `Open the "${GUIDED_EMAIL_2_SUBJECT}" email and make your call.`,
    targetSelector: null,
    noSpotlight: true,
  },
  "email2-judge-trust": {
    stepLabel: "Email 2 of 2",
    title: "Make Your Call",
    description: "Same as before, do you trust this email, or does it look suspicious?",
    targetSelector: null,
    noSpotlight: true,
  },
  "email2-judge-confidence": {
    stepLabel: "Email 2 of 2",
    title: "Rate Your Confidence",
    description: "Rate your confidence in that call.",
    targetSelector: null,
    noSpotlight: true,
  },
  "email2-action": {
    stepLabel: "Email 2 of 2",
    title: "Delete it",
    description: "This time, try deleting the email instead.",
    targetSelector: null,
    noSpotlight: true,
  },
  "email2-followup": {
    stepLabel: "Email 2 of 2",
    title: "Tell Us More About Your Action",
    description: "Same three questions as before: confidence, difficulty, and why you chose that action.",
    targetSelector: null,
    noSpotlight: true,
  },
};

const GUIDED_REQUIRED_ACTION: Partial<Record<GuidedStepKey, ActionType>> = {
  "email1-action": "open_attachment",
  "email2-action": "delete",
};

const TOOLBAR_ACTIONS: ActionType[] = [
  "delete",
  "report_phishing",
  "reply",
  "forward",
  "ignore",
  "verify_independently",
];

export function TutorialScreen({ onFinish }: Props) {
  const [tourActive, setTourActive] = useState(true);
  const [tourIndex, setTourIndex] = useState(0);
  const [guidedActive, setGuidedActive] = useState(false);
  const [guidedTransitionAcknowledged, setGuidedTransitionAcknowledged] = useState(false);
  const [closingTourActive, setClosingTourActive] = useState(false);
  const [closingTourIndex, setClosingTourIndex] = useState(0);
  const tourStepKey = TOUR_STEPS[tourIndex].key;

  const [selectedEmail, setSelectedEmail] = useState<DummyEmail | null>(PRACTICE_EMAILS[0]);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [pendingRecipient, setPendingRecipient] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<ActionType | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [judgmentStep, setJudgmentStep] = useState<JudgmentStep>("trust");
  const [perceivedLegitimacy, setPerceivedLegitimacy] = useState<PerceivedLegitimacy | null>(null);
  const [judgmentConfidenceValue, setJudgmentConfidenceValue] = useState<number | null>(null);
  const [confidenceValue, setConfidenceValueState] = useState<number | null>(null);
  const [difficultyValue, setDifficultyValue] = useState<number | null>(null);
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [otherCueText, setOtherCueText] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReasonText, setOtherReasonText] = useState("");
  const [actionReasonOptions, setActionReasonOptions] = useState<
    Record<string, ActionReasonOption[]>
  >({});
  const [cueOptions, setCueOptions] = useState<CueOption[]>([]);
  const [processed, setProcessed] = useState<Map<string, ProcessedInfo>>(new Map());
  const [currentFolder, setCurrentFolder] = useState<FolderName>("inbox");
  const [sentItems, setSentItems] = useState<SentItem[]>([]);
  const [selectedSentItem, setSelectedSentItem] = useState<SentItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const isMidFlow = selectedEmail !== null && !processed.has(selectedEmail.id) && phase !== "idle";

  // Pauses guided practice between the two emails on a manual "Continue"
  // (rather than auto-advancing straight into email 2) so there's a clear
  // breather between them instead of email 2 popping up immediately.
  const atGuidedTransition =
    guidedActive &&
    processed.has(GUIDED_EMAIL_1) &&
    !processed.has(GUIDED_EMAIL_2) &&
    !guidedTransitionAcknowledged;

  // Which practice email guided practice currently wants the participant to
  // work on - null once both are done, guided practice isn't active, or
  // it's paused at the transition above. Selecting or acting on anything
  // else is blocked below while this is set, which is what actually
  // enforces the guided steps (the highlight is just a visual pointer, not
  // the restriction itself).
  const guidedTargetEmailId =
    guidedActive && !atGuidedTransition
      ? !processed.has(GUIDED_EMAIL_1)
        ? GUIDED_EMAIL_1
        : !processed.has(GUIDED_EMAIL_2)
          ? GUIDED_EMAIL_2
          : null
      : null;

  const currentGuidedStep: GuidedStepKey | null = (() => {
    if (atGuidedTransition) return "email-transition";
    if (!guidedTargetEmailId) return null;
    const n = guidedTargetEmailId === GUIDED_EMAIL_1 ? 1 : 2;
    if (selectedEmail?.id !== guidedTargetEmailId) return `email${n}-open` as GuidedStepKey;
    if (judgmentStep === "trust") return `email${n}-judge-trust` as GuidedStepKey;
    if (judgmentStep === "confidence") return `email${n}-judge-confidence` as GuidedStepKey;
    if (phase === "confidence") return `email${n}-followup` as GuidedStepKey;
    if (judgmentStep === "done" && phase === "idle") return `email${n}-action` as GuidedStepKey;
    // Transient phases (confirming / action-recorded) already have their
    // own self-explanatory modal on screen, so no caption is needed.
    return null;
  })();

  const guidedRequiredAction = currentGuidedStep ? GUIDED_REQUIRED_ACTION[currentGuidedStep] : undefined;
  const guidedDisabledActions = guidedRequiredAction
    ? TOOLBAR_ACTIONS.filter((a) => a !== guidedRequiredAction)
    : [];

  useEffect(() => {
    getActionReasons().then(setActionReasonOptions);
    getCueOptions().then(setCueOptions);
  }, []);

  // Guided practice hands off to the short closing tour the moment both
  // practice emails have been processed.
  useEffect(() => {
    if (guidedActive && processed.has(GUIDED_EMAIL_1) && processed.has(GUIDED_EMAIL_2)) {
      setGuidedActive(false);
      setClosingTourActive(true);
    }
  }, [guidedActive, processed]);

  const handleSkipGuidedPractice = () => {
    setGuidedActive(false);
    setClosingTourActive(true);
  };

  const handleGuidedTransitionContinue = () => {
    setGuidedTransitionAcknowledged(true);
  };

  const handleRestartTutorial = () => {
    setSelectedEmail(PRACTICE_EMAILS[0]);
    setPendingAction(null);
    setPendingRecipient(null);
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
    setConfidenceValueState(null);
    setDifficultyValue(null);
    setSelectedCues([]);
    setOtherCueText("");
    setSelectedReasons([]);
    setOtherReasonText("");
    setGuidedActive(false);
    setGuidedTransitionAcknowledged(false);
    setClosingTourActive(false);
    setClosingTourIndex(0);
    setTourIndex(0);
    setTourActive(true);
  };

  const folderOf = (emailId: string) => folderForAction(processed.get(emailId)?.action);

  const handleSelectFolder = (folder: FolderName) => {
    if (tourActive || guidedActive || isMidFlow) return;
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setSelectedSentItem(null);
    setPhase("idle");
    setJudgmentStep("done");
  };

  const handleSelectEmail = (email: DummyEmail) => {
    if (tourActive || isMidFlow || composeOpen) return;
    if (guidedActive && email.id !== guidedTargetEmailId) return;

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
    if (tourActive) return;
    setPerceivedLegitimacy(value);
    setJudgmentStep("confidence");
  };

  const handleSelectJudgmentConfidence = (value: number) => {
    if (tourActive) return;
    setJudgmentConfidenceValue(value);
    setJudgmentStep("done");
  };

  const commitAction = (action: ActionType, recipient: string | null, composedBody?: string) => {
    if (!selectedEmail) return;
    const sentAt = Date.now();

    setPendingAction(action);
    setPendingRecipient(recipient);
    setPhase("confidence");
    setConfidenceValueState(null);
    setDifficultyValue(null);
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

  const handleSubmitConfidence = () => {
    if (!selectedEmail || !pendingAction || confidenceValue === null || difficultyValue === null)
      return;

    const updated = new Map(processed);
    updated.set(selectedEmail.id, {
      action: pendingAction,
      confidence: confidenceValue,
      recipient: pendingRecipient,
    });
    setProcessed(updated);
    setPhase("idle");

    if (folderForAction(pendingAction) !== currentFolder) {
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
    if (guidedRequiredAction && action !== guidedRequiredAction) return;

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
  // During the informational tour, the ribbon stays visually active and
  // hoverable (so its tooltips work while it's being explained) - real
  // clicks are no-ops via the tourActive check in handleSelectAction, not
  // by disabling the buttons. Outside the tour, the normal locking rules
  // apply as usual.
  const ribbonDisabled = tourActive
    ? false
    : !selectedEmail ||
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
        disabledActions={guidedDisabledActions}
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

      {phase === "confidence" && (
        <ConfidenceModal
          actionLabel={pendingAction ? ACTION_LABELS[pendingAction] : ""}
          cueOptions={cueOptions}
          reasonOptions={pendingAction ? actionReasonOptions[pendingAction] ?? [] : []}
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

      {!tourActive && !guidedActive && !closingTourActive && (
        <div className="tutorial-actions">
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
        </div>
      )}

      {/* Demo popup for the "After You Act" tour step - a stand-in
          confidence modal with no real state behind it, just so there's
          something for that step to spotlight. Inert (pointer-events: none)
          since it's a preview only - the tour's own Next button is what
          advances, not this modal's, and the two shouldn't be confusable. */}
      {tourActive && tourStepKey === "after-act" && (
        <div className="tutorial-demo-popup">
          <ConfidenceModal
            actionLabel={ACTION_LABELS.delete}
            cueOptions={cueOptions}
            reasonOptions={actionReasonOptions["delete"] ?? []}
            confidenceValue={null}
            onConfidenceChange={() => {}}
            difficultyValue={null}
            onDifficultyChange={() => {}}
            selectedCues={[]}
            onToggleCue={() => {}}
            otherCueText=""
            onOtherCueTextChange={() => {}}
            selectedReasons={[]}
            onToggleReason={() => {}}
            otherReasonText=""
            onOtherReasonTextChange={() => {}}
            onSubmit={() => {}}
          />
        </div>
      )}

      {tourActive && (
        <TutorialSpotlight
          steps={TOUR_STEPS}
          index={tourIndex}
          onIndexChange={setTourIndex}
          onFinish={() => {
            setTourActive(false);
            setGuidedActive(true);
            // Reset the reading pane to empty so guided practice genuinely
            // starts with "click this email" rather than picking up
            // whatever was pre-selected for the informational tour.
            setSelectedEmail(null);
            setPhase("idle");
            setJudgmentStep("trust");
            setPerceivedLegitimacy(null);
            setJudgmentConfidenceValue(null);
          }}
        />
      )}

      {guidedActive && currentGuidedStep && (
        <GuidedCaption
          stepLabel={GUIDED_STEP_CONTENT[currentGuidedStep].stepLabel}
          title={GUIDED_STEP_CONTENT[currentGuidedStep].title}
          description={GUIDED_STEP_CONTENT[currentGuidedStep].description}
          targetSelector={GUIDED_STEP_CONTENT[currentGuidedStep].targetSelector}
          noSpotlight={GUIDED_STEP_CONTENT[currentGuidedStep].noSpotlight}
          onSkip={handleSkipGuidedPractice}
          onContinue={currentGuidedStep === "email-transition" ? handleGuidedTransitionContinue : undefined}
          continueLabel="Continue"
        />
      )}

      {closingTourActive && (
        <TutorialSpotlight
          steps={CLOSING_TOUR_STEPS}
          index={closingTourIndex}
          onIndexChange={setClosingTourIndex}
          onFinish={() => setClosingTourActive(false)}
        />
      )}
    </div>
  );
}

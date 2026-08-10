import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowForward20Regular,
  ArrowReply20Regular,
  Attach20Regular,
  Delete20Regular,
  Dismiss20Regular,
  Link20Regular,
  MailRead20Regular,
  QuestionCircle24Filled,
  SearchShield20Regular,
  ShieldError20Regular,
} from "@fluentui/react-icons";

const SUMMARY_STEPS: { term: string; description: string }[] = [
  { term: "Read", description: "the email." },
  { term: "Decide", description: "whether you trust it or find it suspicious." },
  { term: "Act", description: "with whichever response fits, from the actions below." },
  { term: "Answer", description: "a few short questions about your call." },
];

const ACTION_DEFINITIONS: { term: string; icon: ReactNode; definition: string }[] = [
  { term: "Reply", icon: <ArrowReply20Regular />, definition: "Send a response back to the sender." },
  {
    term: "Forward",
    icon: <ArrowForward20Regular />,
    definition: "Send the email on to someone else, such as IT.",
  },
  {
    term: "Report as Phishing",
    icon: <ShieldError20Regular />,
    definition: "Flag the email as a phishing attempt. It moves to Junk Email.",
  },
  { term: "Delete", icon: <Delete20Regular />, definition: "Remove the email from your inbox." },
  {
    term: "Mark as read",
    icon: <MailRead20Regular />,
    definition: "Leave the email as-is without taking any other action.",
  },
  { term: "Click a link", icon: <Link20Regular />, definition: "Open a link included in the email." },
  {
    term: "Open an attachment",
    icon: <Attach20Regular />,
    definition: "Download or open a file attached to the email.",
  },
  {
    term: "Verify Independently",
    icon: <SearchShield20Regular />,
    definition:
      "Confirm you'd check the sender or claim through a separate, trusted channel (e.g. calling the company or visiting their official site) rather than relying on anything in the email.",
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="help-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help" : "Open help"}
      >
        {open ? <Dismiss20Regular /> : <QuestionCircle24Filled />}
      </button>

      {open && (
        <div className="help-popup">
          <div className="help-popup-body">
            <div className="help-section-heading">What You'll Do</div>
            <div className="help-summary">
              {SUMMARY_STEPS.map((step) => (
                <div key={step.term} className="help-summary-step">
                  <strong>{step.term}</strong> {step.description}
                </div>
              ))}
            </div>

            <div className="help-divider" />
            <div className="help-section-heading">Actions</div>

            <dl className="help-definitions">
              {ACTION_DEFINITIONS.map((item) => (
                <div key={item.term} className="help-definition-row">
                  <dt>
                    <span className="help-definition-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.term}
                  </dt>
                  <dd>{item.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}

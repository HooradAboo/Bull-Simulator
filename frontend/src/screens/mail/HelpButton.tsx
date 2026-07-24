import { useState } from "react";
import { Dismiss20Regular, QuestionCircle24Filled } from "@fluentui/react-icons";

const TOPICS = [
  { key: "tasks", label: "Task Definitions" },
  { key: "howto", label: "What You'll Do" },
] as const;

type TopicKey = (typeof TOPICS)[number]["key"];

const ACTION_DEFINITIONS: { term: string; definition: string }[] = [
  { term: "Reply", definition: "Send a response back to the sender." },
  { term: "Forward", definition: "Send the email on to someone else, such as IT." },
  {
    term: "Report as Phishing",
    definition: "Flag the email as a phishing attempt. It moves to Junk Email.",
  },
  { term: "Delete", definition: "Remove the email from your inbox." },
  { term: "Mark as read", definition: "Leave the email as-is without taking any other action." },
  { term: "Click a link", definition: "Open a link included in the email." },
  { term: "Open an attachment", definition: "Download or open a file attached to the email." },
  {
    term: "Verify Independently",
    definition:
      "Check the sender or company through a separate channel (their website, a phone number, someone you know) instead of relying on the email itself.",
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<TopicKey>("tasks");

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
          <div className="help-popup-tabs">
            {TOPICS.map((t) => (
              <button
                key={t.key}
                className={`help-tab${topic === t.key ? " active" : ""}`}
                onClick={() => setTopic(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="help-popup-body">
            {topic === "tasks" && (
              <dl className="help-definitions">
                {ACTION_DEFINITIONS.map((item) => (
                  <div key={item.term} className="help-definition-row">
                    <dt>{item.term}</dt>
                    <dd>{item.definition}</dd>
                  </div>
                ))}
              </dl>
            )}

            {topic === "howto" && (
              <ol className="help-steps">
                <li>
                  <strong>Read</strong> the email.
                </li>
                <li>
                  <strong>Choose an action</strong> for it from the ribbon above.
                </li>
                <li>
                  <strong>Answer a few short questions</strong> about your decision - whether you
                  trust the email, how confident you are, what stood out to you, and how difficult
                  it was.
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}

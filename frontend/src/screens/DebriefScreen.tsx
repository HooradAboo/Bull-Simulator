import { useState } from "react";
import "./page.css";
import { PageTemplate } from "./PageTemplate";

interface Props {
  onViewReport: () => void;
}

export function DebriefScreen({ onViewReport }: Props) {
  const [declined, setDeclined] = useState(false);

  return (
    <PageTemplate
      title="Debrief"
      subtitle="[Placeholder debrief text.] Thank you for participating. The emails
        you saw were part of a research study on phishing susceptibility."
    >
      <hr className="page-divider" />
      {declined ? (
        <p className="body">Thanks again for participating. You're all done.</p>
      ) : (
        <>
          <p className="body">Would you like to see a report of how you did?</p>
          <div className="page-actions">
            <button className="page-button" onClick={onViewReport}>
              Yes, show me the report
            </button>
            <button className="page-button-secondary" onClick={() => setDeclined(true)}>
              No thanks
            </button>
          </div>
        </>
      )}
    </PageTemplate>
  );
}

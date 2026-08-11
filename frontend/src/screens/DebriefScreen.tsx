import { useState } from "react";
import "./page.css";
import { PageTemplate } from "./PageTemplate";

interface Props {
  onViewReport: () => void;
}

export function DebriefScreen({ onViewReport }: Props) {
  const [declined, setDeclined] = useState(false);

  return (
    <PageTemplate title="Thank You">
      <p className="body">
        Thanks for taking part. You worked through a simulated inbox, making decisions about
        which emails to trust and how to act on them, while we recorded your responses and
        confidence ratings along the way.
      </p>
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

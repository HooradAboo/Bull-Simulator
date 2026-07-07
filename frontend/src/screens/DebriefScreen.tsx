import { useState } from "react";

export function DebriefScreen() {
  const [comments, setComments] = useState("");

  return (
    <div className="screen">
      <h1>Debrief</h1>
      <p>
        [Placeholder debrief text.] Thank you for participating. The emails
        you saw were part of a research study on phishing susceptibility.
      </p>
      <label htmlFor="debrief-comments">Any comments? (optional)</label>
      <textarea
        id="debrief-comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={4}
      />
    </div>
  );
}

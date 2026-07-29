import { useEffect, useState } from "react";
import { CheckmarkCircle48Regular, Dismiss12Regular, Search20Regular } from "@fluentui/react-icons";
import type { IndependentSearchTarget } from "./BrowserChrome";

interface Props {
  target: IndependentSearchTarget | null;
  onSearch: (query: string) => void;
  onReturnToMail: () => void;
}

function GoogleWordmark({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "search-wordmark search-wordmark-compact" : "search-wordmark"}>
      <span style={{ color: "#4285F4" }}>G</span>
      <span style={{ color: "#EA4335" }}>o</span>
      <span style={{ color: "#FBBC05" }}>o</span>
      <span style={{ color: "#4285F4" }}>g</span>
      <span style={{ color: "#34A853" }}>l</span>
      <span style={{ color: "#EA4335" }}>e</span>
    </div>
  );
}

export function SearchTabPage({ target, onSearch, onReturnToMail }: Props) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [showRecordedPopup, setShowRecordedPopup] = useState(false);

  // A new email being verified (or no email at all) means any previous
  // search's "recorded" state no longer applies - start the tab fresh
  // instead of leaving a stale confirmation from a different email on screen.
  useEffect(() => {
    setQuery("");
    setSubmittedQuery(null);
    setShowRecordedPopup(false);
  }, [target?.id]);

  // Searching is only possible with an unprocessed email open in Mail to
  // attribute it to - the inputs below are disabled otherwise, but this
  // guards direct calls too (e.g. Enter on a disabled field).
  const handleSearch = () => {
    if (!target) return;
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    setSubmittedQuery(trimmed);
    onSearch(trimmed);
    setShowRecordedPopup(true);
  };

  const handleReturnToMail = () => {
    setShowRecordedPopup(false);
    onReturnToMail();
  };

  if (submittedQuery) {
    return (
      <div className="search-page-results">
        <div className="search-results-header">
          <GoogleWordmark compact />
          <div className={`search-results-box ${!target ? "disabled" : ""}`}>
            <Search20Regular />
            <input
              className="search-results-input"
              value={query}
              disabled={!target}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>

        <div className="search-fake-results">
          <div className="search-fake-result">
            <div className="search-fake-result-url">www.example.com</div>
            <div className="search-fake-result-title">{submittedQuery} - Search Results</div>
            <div className="search-fake-result-snippet">
              Results for this query aren't available in this simulated environment.
            </div>
          </div>
        </div>

        {showRecordedPopup && (
          <div className="search-recorded-modal-backdrop">
            <div className="search-recorded-modal">
              <span
                className="search-recorded-modal-close"
                onClick={() => setShowRecordedPopup(false)}
              >
                <Dismiss12Regular />
              </span>
              <CheckmarkCircle48Regular className="search-recorded-modal-icon" />
              <div className="search-recorded-modal-title">This action has been recorded</div>
              <div className="search-recorded-modal-subtitle">
                Head back to the Mail tab to continue with your tasks.
              </div>
              <button className="search-recorded-modal-button" onClick={handleReturnToMail}>
                Return to Mail
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="search-page-home">
      <GoogleWordmark />
      <div className={`search-home-box ${!target ? "disabled" : ""}`}>
        <Search20Regular />
        <input
          className="search-home-input"
          placeholder={target ? "Search Google or type a URL" : "Open an email in Mail to search"}
          value={query}
          disabled={!target}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          autoFocus
        />
      </div>
      <button className="search-home-button" disabled={!target} onClick={handleSearch}>
        Google Search
      </button>
    </div>
  );
}

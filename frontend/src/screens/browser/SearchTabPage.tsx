import { useEffect, useState } from "react";
import { CheckmarkCircle20Filled, Info20Regular, Search20Regular } from "@fluentui/react-icons";
import type { IndependentSearchTarget } from "./BrowserChrome";

interface Props {
  target: IndependentSearchTarget | null;
  onSearch: (query: string) => void;
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

function ContextBanner({ target }: { target: IndependentSearchTarget | null }) {
  return (
    <div className={`search-context-banner ${target ? "linked" : "unlinked"}`}>
      <Info20Regular className="search-context-icon" />
      {target ? (
        <span>
          Verifying: <strong>{target.label}</strong>
        </span>
      ) : (
        <span>Open an unprocessed email in the Mail tab, then come back here to verify it.</span>
      )}
    </div>
  );
}

export function SearchTabPage({ target, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [wasRecorded, setWasRecorded] = useState(false);

  // A new email being verified (or no email at all) means any previous
  // search's "recorded" banner no longer applies - start the tab fresh
  // instead of leaving a stale confirmation from a different email on screen.
  useEffect(() => {
    setQuery("");
    setSubmittedQuery(null);
    setWasRecorded(false);
  }, [target?.id]);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    setSubmittedQuery(trimmed);
    if (target) {
      onSearch(trimmed);
      setWasRecorded(true);
    }
  };

  if (submittedQuery) {
    return (
      <div className="search-page-results">
        <div className="search-results-header">
          <GoogleWordmark compact />
          <div className="search-results-box">
            <Search20Regular />
            <input
              className="search-results-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>

        <ContextBanner target={target} />

        {wasRecorded ? (
          <div className="search-captured-banner">
            <CheckmarkCircle20Filled className="search-captured-icon" />
            <div>
              <div className="search-captured-title">This action has been recorded</div>
              <div className="search-captured-subtitle">
                You can ignore these results and return to the Mail tab.
              </div>
            </div>
          </div>
        ) : (
          <div className="search-not-recorded-banner">
            This search wasn't linked to an email, so it wasn't recorded as an action.
          </div>
        )}

        <div className="search-fake-results">
          <div className="search-fake-result">
            <div className="search-fake-result-url">www.example.com</div>
            <div className="search-fake-result-title">{submittedQuery} - Search Results</div>
            <div className="search-fake-result-snippet">
              Results for this query aren't available in this simulated environment.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page-home">
      <ContextBanner target={target} />
      <GoogleWordmark />
      <div className="search-home-box">
        <Search20Regular />
        <input
          className="search-home-input"
          placeholder="Search Google or type a URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          autoFocus
        />
      </div>
      <button className="search-home-button" onClick={handleSearch}>
        Google Search
      </button>
    </div>
  );
}

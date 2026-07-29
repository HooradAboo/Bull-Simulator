import { useState } from "react";
import { CheckmarkCircle20Filled, Search20Regular } from "@fluentui/react-icons";

interface Props {
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

export function SearchTabPage({ onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    setSubmittedQuery(trimmed);
    onSearch(trimmed);
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

        <div className="search-captured-banner">
          <CheckmarkCircle20Filled className="search-captured-icon" />
          <div>
            <div className="search-captured-title">This action has been recorded</div>
            <div className="search-captured-subtitle">
              You can ignore these results and return to the Mail tab.
            </div>
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
      </div>
    );
  }

  return (
    <div className="search-page-home">
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

import {
  Alert20Regular,
  ChatMultiple20Regular,
  People20Regular,
  Search20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import usfLogo from "../../assets/usf-logo.png";

export function TopBar() {
  return (
    <div className="mail-topbar">
      <div className="waffle" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="mail-brand">
        <img src={usfLogo} alt="University of South Florida" className="crest-logo" />
        <div className="outlook-word">Outlook</div>
      </div>

      <div className="mail-search">
        <Search20Regular aria-hidden="true" />
        <input placeholder="Search" disabled />
      </div>

      <div className="mail-topbar-icons">
        <span className="icon" aria-hidden="true">
          <People20Regular />
        </span>
        <span className="icon" aria-hidden="true">
          <ChatMultiple20Regular />
        </span>
        <span className="icon" aria-hidden="true">
          <Alert20Regular />
        </span>
        <span className="icon" aria-hidden="true">
          <Settings20Regular />
        </span>
        <div className="mail-avatar">P</div>
      </div>
    </div>
  );
}

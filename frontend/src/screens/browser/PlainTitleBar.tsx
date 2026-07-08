import { WindowControls } from "./WindowControls";
import "./browser.css";

// Minimal drag bar + window controls for screens shown outside the
// simulated browser (consent, instructions, debrief) - the window is
// frameless, so every screen needs some way to minimize/close it.
export function PlainTitleBar() {
  return (
    <div className="plain-titlebar">
      <div className="plain-titlebar-drag" />
      <WindowControls />
    </div>
  );
}

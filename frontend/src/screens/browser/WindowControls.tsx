import { useEffect, useState } from "react";
import {
  Dismiss16Regular,
  FullScreenMaximize16Regular,
  FullScreenMinimize16Regular,
  Subtract16Regular,
} from "@fluentui/react-icons";

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    return window.electronAPI.onMaximizedChange(setIsMaximized);
  }, []);

  return (
    <div className="browser-window-controls">
      <button onClick={() => window.electronAPI.minimizeWindow()} title="Minimize">
        <Subtract16Regular />
      </button>
      <button
        onClick={() => window.electronAPI.toggleMaximizeWindow()}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? <FullScreenMinimize16Regular /> : <FullScreenMaximize16Regular />}
      </button>
      <button
        className="browser-close-btn"
        onClick={() => window.electronAPI.closeWindow()}
        title="Close"
      >
        <Dismiss16Regular />
      </button>
    </div>
  );
}

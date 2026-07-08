export {};

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      toggleMaximizeWindow: () => void;
      closeWindow: () => void;
      onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    };
  }
}

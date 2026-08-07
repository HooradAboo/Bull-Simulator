export {};

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void;
      toggleMaximizeWindow: () => void;
      closeWindow: () => void;
      onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
      exportReportPdf: (heightInches: number) => Promise<
        | { success: true; filePath: string }
        | { success: false; canceled?: boolean; error?: string }
      >;
    };
  }
}

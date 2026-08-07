const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const { spawn } = require("child_process");

const isDev = !app.isPackaged;
const BACKEND_DIR = path.join(__dirname, "..", "..", "backend");
const BACKEND_PYTHON = path.join(BACKEND_DIR, ".venv", "bin", "python");

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  backendProcess = spawn(
    BACKEND_PYTHON,
    ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    { cwd: BACKEND_DIR, stdio: "inherit" }
  );

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximized-changed", false);
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window:toggle-maximize", () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on("window:close", () => {
  mainWindow?.close();
});

// Renders the current page (the report screen) to a single-page PDF sized
// to exactly fit its content, rather than letting Chromium paginate it
// across however many Letter-sized pages the content would normally span.
// heightInches is measured in the renderer (full unclipped content height,
// converted from px), so this only ever needs one page, with no cutoff and
// no wasted trailing blank space beyond the small safety buffer already
// baked into that measurement.
ipcMain.handle("report:export-pdf", async (event, { heightInches }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: "Save Report as PDF",
    defaultPath: "phishing-study-report.pdf",
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });
  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  try {
    // Despite the "in pixels" wording in Electron's own type docs, these
    // margins are actually interpreted in inches (they're forwarded
    // straight through to Chromium's print pipeline, which is inches
    // throughout) - 36 here previously meant 36in, dwarfing any realistic
    // page size and tripping "margins must be less than or equal to
    // pageSize". 0.4in matches a normal printed-page margin.
    const marginInches = 0.4;
    const pdfBuffer = await event.sender.printToPDF({
      printBackground: true,
      pageSize: { width: 8.5, height: heightInches },
      margins: {
        marginType: "custom",
        top: marginInches,
        bottom: marginInches,
        left: marginInches,
        right: marginInches,
      },
    });
    await fs.writeFile(filePath, pdfBuffer);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopBackend();
});

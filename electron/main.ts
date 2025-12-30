/**
 * Speckit Dashboard - Electron Main Process
 * Window management, IPC setup, and application lifecycle
 */

import { app, BrowserWindow } from "electron";
import path from "path";
import isDev from "electron-is-dev";
import { databaseService } from "./services/database";
import { registerIPCHandlers } from "./services/ipc-handlers";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3 native module
    },
    // titleBarStyle: "hiddenInset",
    show: false,
    backgroundColor: "#1f2937", // gray-800
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Show window when ready to avoid visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ========================================
// Application Lifecycle
// ========================================

app.whenReady().then(() => {
  // Initialize database
  databaseService.initialize();

  // Register IPC handlers
  registerIPCHandlers();

  // Create main window
  createWindow();

  // macOS: Recreate window when dock icon clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Cleanup on quit
app.on("before-quit", () => {
  databaseService.close();
});

// ========================================
// Export for testing
// ========================================

export { mainWindow };

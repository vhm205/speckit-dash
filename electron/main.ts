/**
 * Speckit Dashboard - Electron Main Process
 * Window management, IPC setup, and application lifecycle
 */

import { app, BrowserWindow } from "electron";
import path from "path";
import isDev from "electron-is-dev";
import { databaseService } from "./services/database";
import { registerIPCHandlers } from "./services/ipc-handlers";
import { autoUpdater } from "electron-updater";

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
// Auto-Updater Configuration
// ========================================

function setupAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false; // Ask user before downloading
  autoUpdater.autoInstallOnAppQuit = true; // Install when app quits

  // Logging
  autoUpdater.logger = console;

  // Event: Checking for update
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
  });

  // Event: Update available
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info);

    // Show dialog to user
    if (mainWindow) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  // Event: Update not available
  autoUpdater.on("update-not-available", (info) => {
    console.log("Update not available:", info);
  });

  // Event: Update downloaded
  autoUpdater.on("update-downloaded", (info) => {
    console.log("Update downloaded:", info);

    // Notify user that update is ready to install
    if (mainWindow) {
      mainWindow.webContents.send("update-downloaded", info);
    }
  });

  // Event: Error occurred
  autoUpdater.on("error", (error) => {
    console.error("Auto-updater error:", error);
  });

  // Event: Download progress
  autoUpdater.on("download-progress", (progress) => {
    console.log(`Download progress: ${progress.percent}%`);

    if (mainWindow) {
      mainWindow.webContents.send("download-progress", progress);
    }
  });

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 6 * 60 * 60 * 1000);
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

  // Setup auto-updater (only in production)
  if (!isDev) {
    setupAutoUpdater();
  }

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

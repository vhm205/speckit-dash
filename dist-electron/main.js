"use strict";
/**
 * Speckit Dashboard - Electron Main Process
 * Window management, IPC setup, and application lifecycle
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const database_1 = require("./services/database");
const ipc_handlers_1 = require("./services/ipc-handlers");
let mainWindow = null;
exports.mainWindow = mainWindow;
function createWindow() {
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Required for better-sqlite3 native module
        },
        // titleBarStyle: "hiddenInset",
        show: false,
        backgroundColor: "#1f2937", // gray-800
    });
    // Load the app
    if (electron_is_dev_1.default) {
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    // Show window when ready to avoid visual flash
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.on("closed", () => {
        exports.mainWindow = mainWindow = null;
    });
}
// ========================================
// Application Lifecycle
// ========================================
electron_1.app.whenReady().then(() => {
    // Initialize database
    database_1.databaseService.initialize();
    // Register IPC handlers
    (0, ipc_handlers_1.registerIPCHandlers)();
    // Create main window
    createWindow();
    // macOS: Recreate window when dock icon clicked
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed (except on macOS)
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
// Cleanup on quit
electron_1.app.on("before-quit", () => {
    database_1.databaseService.close();
});

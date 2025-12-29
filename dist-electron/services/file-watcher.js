"use strict";
/**
 * Speckit Dashboard - File Watcher Service
 * Watch Spec-kit files for changes and trigger updates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileWatcherService = void 0;
const electron_1 = require("electron");
const chokidar_1 = __importDefault(require("chokidar"));
const path_1 = __importDefault(require("path"));
class FileWatcherService {
    watcher = null;
    projectPath = null;
    debounceTimers = new Map();
    debounceMs = 500;
    /**
     * Start watching a project directory
     */
    start(projectPath) {
        // Stop any existing watcher
        this.stop();
        this.projectPath = projectPath;
        // Watch specs directory and .specify folder
        const watchPaths = [
            path_1.default.join(projectPath, "specs"),
            path_1.default.join(projectPath, ".specify"),
        ];
        this.watcher = chokidar_1.default.watch(watchPaths, {
            ignored: [
                /(^|[/\\])\../, // dotfiles except .specify
                /node_modules/,
                /\.git/,
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100,
            },
        });
        // Handle file events with debouncing
        this.watcher
            .on("add", (filePath) => this.handleFileEvent("add", filePath))
            .on("change", (filePath) => this.handleFileEvent("change", filePath))
            .on("unlink", (filePath) => this.handleFileEvent("unlink", filePath))
            .on("error", (error) => console.error("File watcher error:", error));
    }
    /**
     * Stop watching files
     */
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        this.projectPath = null;
        // Clear all debounce timers
        this.debounceTimers.forEach((timer) => clearTimeout(timer));
        this.debounceTimers.clear();
    }
    /**
     * Handle a file change event with debouncing
     */
    handleFileEvent(eventType, filePath) {
        // Only process markdown files
        if (!filePath.endsWith(".md"))
            return;
        // Debounce by file path
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        const timer = setTimeout(() => {
            this.debounceTimers.delete(filePath);
            this.emitFileChange({
                eventType,
                filePath,
                affectedFeatureId: this.extractFeatureId(filePath),
            });
        }, this.debounceMs);
        this.debounceTimers.set(filePath, timer);
    }
    /**
     * Extract feature ID from file path if possible
     */
    extractFeatureId(filePath) {
        // Match feature directory pattern like "001-feature-name"
        const match = filePath.match(/\/specs\/(\d+)-[^/]+\//);
        if (match) {
            return parseInt(match[1], 10);
        }
        return undefined;
    }
    /**
     * Emit file change event to all renderer windows
     */
    emitFileChange(event) {
        const windows = electron_1.BrowserWindow.getAllWindows();
        windows.forEach((window) => {
            if (!window.isDestroyed()) {
                window.webContents.send("file-watcher:change", event);
            }
        });
    }
    /**
     * Get current watch status
     */
    isWatching() {
        return this.watcher !== null;
    }
    /**
     * Get the path being watched
     */
    getWatchPath() {
        return this.projectPath;
    }
}
// Export singleton instance
exports.fileWatcherService = new FileWatcherService();
exports.default = exports.fileWatcherService;

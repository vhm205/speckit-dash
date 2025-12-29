/**
 * Speckit Dashboard - File Watcher Service
 * Watch Spec-kit files for changes and trigger updates
 */

import { BrowserWindow } from "electron";
import chokidar, { FSWatcher } from "chokidar";
import path from "path";

interface FileChangeEvent {
  eventType: "add" | "change" | "unlink";
  filePath: string;
  affectedFeatureId?: number;
}

class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private projectPath: string | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceMs = 500;

  /**
   * Start watching a project directory
   */
  start(projectPath: string): void {
    // Stop any existing watcher
    this.stop();

    this.projectPath = projectPath;

    // Watch specs directory and .specify folder
    const watchPaths = [
      path.join(projectPath, "specs"),
      path.join(projectPath, ".specify"),
    ];

    this.watcher = chokidar.watch(watchPaths, {
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
  stop(): void {
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
  private handleFileEvent(
    eventType: "add" | "change" | "unlink",
    filePath: string,
  ): void {
    // Only process markdown files
    if (!filePath.endsWith(".md")) return;

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
  private extractFeatureId(filePath: string): number | undefined {
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
  private emitFileChange(event: FileChangeEvent): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send("file-watcher:change", event);
      }
    });
  }

  /**
   * Get current watch status
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }

  /**
   * Get the path being watched
   */
  getWatchPath(): string | null {
    return this.projectPath;
  }
}

// Export singleton instance
export const fileWatcherService = new FileWatcherService();
export default fileWatcherService;

/**
 * Speckit Dashboard - Preload Script
 * Secure context bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer } from "electron";

// File change event type (inline to avoid cross-project import)
type FileEventType = "add" | "change" | "unlink";
interface FileChangeEvent {
  eventType: FileEventType;
  filePath: string;
  affectedFeatureId?: number;
}

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // ========================================
  // Project Methods
  // ========================================

  configureProject: (rootPath: string) =>
    ipcRenderer.invoke("project:configure", { rootPath }),

  listProjects: () => ipcRenderer.invoke("project:list"),

  selectProject: (projectId: number) =>
    ipcRenderer.invoke("project:select", { projectId }),

  removeProject: (projectId: number) =>
    ipcRenderer.invoke("project:remove", { projectId }),

  // ========================================
  // Feature Methods
  // ========================================

  listFeatures: (
    projectId: number,
    filters?: { status?: string; priority?: string },
  ) => ipcRenderer.invoke("features:list", { projectId, filters }),

  getFeature: (featureId: number) =>
    ipcRenderer.invoke("features:get", { featureId }),

  // ========================================
  // Task Methods
  // ========================================

  listTasks: (featureId: number, groupBy?: "phase" | "status" | "story") =>
    ipcRenderer.invoke("tasks:list", { featureId, groupBy }),

  // ========================================
  // Entity Methods
  // ========================================

  listEntities: (featureId: number) =>
    ipcRenderer.invoke("entities:list", { featureId }),

  // ========================================
  // Stats Methods
  // ========================================

  getStatsOverview: (projectId: number) =>
    ipcRenderer.invoke("stats:overview", { projectId }),

  // ========================================
  // File Watcher Event Listener
  // ========================================

  onFileChange: (callback: (event: FileChangeEvent) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: FileChangeEvent,
    ) => {
      callback(data);
    };

    ipcRenderer.on("file-watcher:change", handler);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener("file-watcher:change", handler);
    };
  },
});

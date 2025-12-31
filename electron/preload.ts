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

  syncProject: (projectId: number) =>
    ipcRenderer.invoke("project:sync", { projectId }),

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

  // ========================================
  // AI Provider Methods
  // ========================================

  configureAIProvider: (
    provider: "openai" | "ollama" | "openrouter",
    config: Record<string, unknown>,
  ) => ipcRenderer.invoke("ai-provider:configure", { provider, config }),

  getAIProviderConfig: () => ipcRenderer.invoke("ai-provider:get-config"),

  switchAIProvider: (provider: "openai" | "ollama" | "openrouter") =>
    ipcRenderer.invoke("ai-provider:switch", { provider }),

  testAIConnection: (provider: "openai" | "ollama" | "openrouter") =>
    ipcRenderer.invoke("ai-provider:test-connection", { provider }),

  // ========================================
  // AI Analysis Methods
  // ========================================

  generateSummary: (featureId: number, filePath: string, force?: boolean) =>
    ipcRenderer.invoke("ai-analysis:generate-summary", {
      featureId,
      filePath,
      force,
    }),

  checkConsistency: (featureId: number, files: string[]) =>
    ipcRenderer.invoke("ai-analysis:check-consistency", { featureId, files }),

  findGaps: (featureId: number, filePath: string) =>
    ipcRenderer.invoke("ai-analysis:find-gaps", { featureId, filePath }),

  getAnalysisHistory: (
    featureId: number,
    analysisType?: string,
    limit?: number,
  ) =>
    ipcRenderer.invoke("ai-analysis:get-history", {
      featureId,
      analysisType,
      limit,
    }),

  getAnalysisResult: (requestId: string) =>
    ipcRenderer.invoke("ai-analysis:get-result", { requestId }),

  // ========================================
  // Schema Methods
  // ========================================

  generateSchema: (featureId: number) =>
    ipcRenderer.invoke("schema:generate", { featureId }),

  getEntityDetails: (entityId: number) =>
    ipcRenderer.invoke("schema:get-entity-details", { entityId }),

  // ========================================
  // Architecture Analysis Methods
  // ========================================

  analyzeArchitecture: (featureId: number, force?: boolean) =>
    ipcRenderer.invoke("architecture:analyze", { featureId, force }),

  // ========================================
  // File Content Methods
  // ========================================

  readSpecFile: (
    featureId: number,
    fileType: "spec" | "plan" | "tasks" | "data-model" | "requirements",
  ) => ipcRenderer.invoke("files:read-spec", { featureId, fileType }),
});

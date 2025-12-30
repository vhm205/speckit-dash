"use strict";
/**
 * Speckit Dashboard - Preload Script
 * Secure context bridge between main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods to the renderer process
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // ========================================
    // Project Methods
    // ========================================
    configureProject: (rootPath) => electron_1.ipcRenderer.invoke("project:configure", { rootPath }),
    listProjects: () => electron_1.ipcRenderer.invoke("project:list"),
    selectProject: (projectId) => electron_1.ipcRenderer.invoke("project:select", { projectId }),
    removeProject: (projectId) => electron_1.ipcRenderer.invoke("project:remove", { projectId }),
    syncProject: (projectId) => electron_1.ipcRenderer.invoke("project:sync", { projectId }),
    // ========================================
    // Feature Methods
    // ========================================
    listFeatures: (projectId, filters) => electron_1.ipcRenderer.invoke("features:list", { projectId, filters }),
    getFeature: (featureId) => electron_1.ipcRenderer.invoke("features:get", { featureId }),
    // ========================================
    // Task Methods
    // ========================================
    listTasks: (featureId, groupBy) => electron_1.ipcRenderer.invoke("tasks:list", { featureId, groupBy }),
    // ========================================
    // Entity Methods
    // ========================================
    listEntities: (featureId) => electron_1.ipcRenderer.invoke("entities:list", { featureId }),
    // ========================================
    // Stats Methods
    // ========================================
    getStatsOverview: (projectId) => electron_1.ipcRenderer.invoke("stats:overview", { projectId }),
    // ========================================
    // File Watcher Event Listener
    // ========================================
    onFileChange: (callback) => {
        const handler = (_event, data) => {
            callback(data);
        };
        electron_1.ipcRenderer.on("file-watcher:change", handler);
        // Return unsubscribe function
        return () => {
            electron_1.ipcRenderer.removeListener("file-watcher:change", handler);
        };
    },
    // ========================================
    // AI Provider Methods
    // ========================================
    configureAIProvider: (provider, config) => electron_1.ipcRenderer.invoke("ai-provider:configure", { provider, config }),
    getAIProviderConfig: () => electron_1.ipcRenderer.invoke("ai-provider:get-config"),
    switchAIProvider: (provider) => electron_1.ipcRenderer.invoke("ai-provider:switch", { provider }),
    testAIConnection: (provider) => electron_1.ipcRenderer.invoke("ai-provider:test-connection", { provider }),
    // ========================================
    // AI Analysis Methods
    // ========================================
    generateSummary: (featureId, filePath, force) => electron_1.ipcRenderer.invoke("ai-analysis:generate-summary", {
        featureId,
        filePath,
        force,
    }),
    checkConsistency: (featureId, files) => electron_1.ipcRenderer.invoke("ai-analysis:check-consistency", { featureId, files }),
    findGaps: (featureId, filePath) => electron_1.ipcRenderer.invoke("ai-analysis:find-gaps", { featureId, filePath }),
    getAnalysisHistory: (featureId, analysisType, limit) => electron_1.ipcRenderer.invoke("ai-analysis:get-history", {
        featureId,
        analysisType,
        limit,
    }),
    getAnalysisResult: (requestId) => electron_1.ipcRenderer.invoke("ai-analysis:get-result", { requestId }),
    // ========================================
    // Schema Methods
    // ========================================
    generateSchema: (featureId) => electron_1.ipcRenderer.invoke("schema:generate", { featureId }),
    getEntityDetails: (entityId) => electron_1.ipcRenderer.invoke("schema:get-entity-details", { entityId }),
    // ========================================
    // Architecture Analysis Methods
    // ========================================
    analyzeArchitecture: (featureId, force) => electron_1.ipcRenderer.invoke("architecture:analyze", { featureId, force }),
    // ========================================
    // File Content Methods
    // ========================================
    readSpecFile: (featureId, fileType) => electron_1.ipcRenderer.invoke("files:read-spec", { featureId, fileType }),
});

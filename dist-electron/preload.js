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
});

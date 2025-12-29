"use strict";
/**
 * Speckit Dashboard - IPC Handlers
 * Handle IPC communication from renderer process
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const file_watcher_1 = require("./file-watcher");
const feature_sync_1 = require("./feature-sync");
/**
 * Validate that a path contains a valid Spec-kit project structure
 */
function validateProjectPath(rootPath) {
    if (!fs_1.default.existsSync(rootPath)) {
        return { valid: false, error: "Path does not exist" };
    }
    const specifyPath = path_1.default.join(rootPath, ".specify");
    if (!fs_1.default.existsSync(specifyPath)) {
        return {
            valid: false,
            error: "Missing .specify folder. Is this a Spec-kit project?",
        };
    }
    const specsPath = path_1.default.join(rootPath, "specs");
    if (!fs_1.default.existsSync(specsPath)) {
        return {
            valid: false,
            error: "Missing specs folder. No feature specifications found.",
        };
    }
    return { valid: true };
}
/**
 * Register all IPC handlers
 */
function registerIPCHandlers() {
    // ========================================
    // Project Handlers
    // ========================================
    electron_1.ipcMain.handle("project:configure", async (_event, { rootPath }) => {
        try {
            const validation = validateProjectPath(rootPath);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                    code: "INVALID_PATH",
                };
            }
            // Get project name from path basename
            const name = path_1.default.basename(rootPath);
            // Check if already exists
            const existing = database_1.databaseService.getProjectByPath(rootPath);
            if (existing) {
                database_1.databaseService.updateProjectLastOpened(existing.id);
                return {
                    success: true,
                    data: {
                        project: {
                            id: existing.id,
                            name: existing.name,
                            rootPath: existing.root_path,
                            lastOpenedAt: Date.now(),
                            createdAt: existing.created_at,
                        },
                    },
                };
            }
            // Create new project
            const project = database_1.databaseService.createProject(name, rootPath);
            // Initial feature sync
            await (0, feature_sync_1.syncProjectFeatures)(project.id, rootPath);
            return {
                success: true,
                data: {
                    project: {
                        id: project.id,
                        name: project.name,
                        rootPath: project.root_path,
                        lastOpenedAt: project.last_opened_at,
                        createdAt: project.created_at,
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    electron_1.ipcMain.handle("project:list", async () => {
        try {
            const projects = database_1.databaseService.getAllProjects();
            return {
                success: true,
                data: {
                    projects: projects.map((p) => ({
                        id: p.id,
                        name: p.name,
                        rootPath: p.root_path,
                        lastOpenedAt: p.last_opened_at,
                        createdAt: p.created_at,
                    })),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    electron_1.ipcMain.handle("project:select", async (_event, { projectId }) => {
        try {
            const project = database_1.databaseService.getProjectById(projectId);
            if (!project) {
                return {
                    success: false,
                    error: "Project not found",
                    code: "NOT_FOUND",
                };
            }
            database_1.databaseService.updateProjectLastOpened(projectId);
            // Start file watcher for this project
            file_watcher_1.fileWatcherService.start(project.root_path);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    electron_1.ipcMain.handle("project:remove", async (_event, { projectId }) => {
        try {
            database_1.databaseService.deleteProject(projectId);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    // ========================================
    // Feature Handlers
    // ========================================
    electron_1.ipcMain.handle("features:list", async (_event, { projectId, filters }) => {
        try {
            const features = database_1.databaseService.getFeaturesByProject(projectId, filters?.status);
            return {
                success: true,
                data: {
                    features: features.map((f) => ({
                        id: f.id,
                        projectId: f.project_id,
                        featureNumber: f.feature_number,
                        featureName: f.feature_name,
                        title: f.title,
                        status: f.status,
                        specPath: f.spec_path,
                        priority: f.priority,
                        createdDate: f.created_date,
                        taskCompletionPct: f.task_completion_pct,
                        createdAt: f.created_at,
                        updatedAt: f.updated_at,
                    })),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    electron_1.ipcMain.handle("features:get", async (_event, { featureId }) => {
        try {
            const feature = database_1.databaseService.getFeatureById(featureId);
            if (!feature) {
                return {
                    success: false,
                    error: "Feature not found",
                    code: "NOT_FOUND",
                };
            }
            const tasks = database_1.databaseService.getTasksByFeature(featureId);
            const entities = database_1.databaseService.getEntitiesByFeature(featureId);
            return {
                success: true,
                data: {
                    feature: {
                        id: feature.id,
                        projectId: feature.project_id,
                        featureNumber: feature.feature_number,
                        featureName: feature.feature_name,
                        title: feature.title,
                        status: feature.status,
                        specPath: feature.spec_path,
                        priority: feature.priority,
                        createdDate: feature.created_date,
                        taskCompletionPct: feature.task_completion_pct,
                        createdAt: feature.created_at,
                        updatedAt: feature.updated_at,
                    },
                    tasks: tasks.map((t) => ({
                        id: t.id,
                        featureId: t.feature_id,
                        taskId: t.task_id,
                        description: t.description,
                        status: t.status,
                        phase: t.phase,
                        phaseOrder: t.phase_order,
                        isParallel: Boolean(t.is_parallel),
                        dependencies: t.dependencies ? JSON.parse(t.dependencies) : [],
                        storyLabel: t.story_label,
                        filePath: t.file_path,
                        lineNumber: t.line_number,
                        createdAt: t.created_at,
                        updatedAt: t.updated_at,
                    })),
                    entities: entities.map((e) => ({
                        id: e.id,
                        featureId: e.feature_id,
                        entityName: e.entity_name,
                        description: e.description,
                        attributes: e.attributes ? JSON.parse(e.attributes) : [],
                        relationships: e.relationships ? JSON.parse(e.relationships) : [],
                        validationRules: e.validation_rules
                            ? JSON.parse(e.validation_rules)
                            : null,
                        stateTransitions: e.state_transitions
                            ? JSON.parse(e.state_transitions)
                            : null,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at,
                    })),
                    requirements: [],
                    plan: null,
                    researchDecisions: [],
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    // ========================================
    // Task Handlers
    // ========================================
    electron_1.ipcMain.handle("tasks:list", async (_event, { featureId }) => {
        try {
            const tasks = database_1.databaseService.getTasksByFeature(featureId);
            return {
                success: true,
                data: {
                    tasks: tasks.map((t) => ({
                        id: t.id,
                        featureId: t.feature_id,
                        taskId: t.task_id,
                        description: t.description,
                        status: t.status,
                        phase: t.phase,
                        phaseOrder: t.phase_order,
                        isParallel: Boolean(t.is_parallel),
                        dependencies: t.dependencies ? JSON.parse(t.dependencies) : [],
                        storyLabel: t.story_label,
                        filePath: t.file_path,
                        lineNumber: t.line_number,
                        createdAt: t.created_at,
                        updatedAt: t.updated_at,
                    })),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    // ========================================
    // Entity Handlers
    // ========================================
    electron_1.ipcMain.handle("entities:list", async (_event, { featureId }) => {
        try {
            const entities = database_1.databaseService.getEntitiesByFeature(featureId);
            return {
                success: true,
                data: {
                    entities: entities.map((e) => ({
                        id: e.id,
                        featureId: e.feature_id,
                        entityName: e.entity_name,
                        description: e.description,
                        attributes: e.attributes ? JSON.parse(e.attributes) : [],
                        relationships: e.relationships ? JSON.parse(e.relationships) : [],
                        validationRules: e.validation_rules
                            ? JSON.parse(e.validation_rules)
                            : null,
                        stateTransitions: e.state_transitions
                            ? JSON.parse(e.state_transitions)
                            : null,
                        createdAt: e.created_at,
                        updatedAt: e.updated_at,
                    })),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
    // ========================================
    // Stats Handlers
    // ========================================
    electron_1.ipcMain.handle("stats:overview", async (_event, { projectId }) => {
        try {
            const stats = database_1.databaseService.getProjectStats(projectId);
            return {
                success: true,
                data: {
                    stats: {
                        totalFeatures: stats.totalFeatures,
                        featuresByStatus: stats.featuresByStatus,
                        avgTaskCompletion: stats.avgTaskCompletion,
                        totalTasks: stats.totalTasks,
                        tasksByStatus: stats.tasksByStatus,
                    },
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                code: "DB_ERROR",
            };
        }
    });
}

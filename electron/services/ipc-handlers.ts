/**
 * Speckit Dashboard - IPC Handlers
 * Handle IPC communication from renderer process
 */

import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { databaseService } from "./database";
import { fileWatcherService } from "./file-watcher";
import { syncProjectFeatures } from "./feature-sync";

/**
 * Validate that a path contains a valid Spec-kit project structure
 */
function validateProjectPath(
  rootPath: string,
): { valid: boolean; error?: string } {
  if (!fs.existsSync(rootPath)) {
    return { valid: false, error: "Path does not exist" };
  }

  const specifyPath = path.join(rootPath, ".specify");
  if (!fs.existsSync(specifyPath)) {
    return {
      valid: false,
      error: "Missing .specify folder. Is this a Spec-kit project?",
    };
  }

  const specsPath = path.join(rootPath, "specs");
  if (!fs.existsSync(specsPath)) {
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
export function registerIPCHandlers(): void {
  // ========================================
  // Project Handlers
  // ========================================

  ipcMain.handle(
    "project:configure",
    async (_event, { rootPath }: { rootPath: string }) => {
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
        const name = path.basename(rootPath);

        // Check if already exists
        const existing = databaseService.getProjectByPath(rootPath);
        if (existing) {
          databaseService.updateProjectLastOpened(existing.id);
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
        const project = databaseService.createProject(name, rootPath);

        // Initial feature sync
        await syncProjectFeatures(project.id, rootPath);

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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  ipcMain.handle("project:list", async () => {
    try {
      const projects = databaseService.getAllProjects();
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "DB_ERROR",
      };
    }
  });

  ipcMain.handle(
    "project:select",
    async (_event, { projectId }: { projectId: number }) => {
      try {
        const project = databaseService.getProjectById(projectId);
        if (!project) {
          return {
            success: false,
            error: "Project not found",
            code: "NOT_FOUND",
          };
        }

        databaseService.updateProjectLastOpened(projectId);

        // Start file watcher for this project
        fileWatcherService.start(project.root_path);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "project:remove",
    async (_event, { projectId }: { projectId: number }) => {
      try {
        databaseService.deleteProject(projectId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // Feature Handlers
  // ========================================

  ipcMain.handle(
    "features:list",
    async (
      _event,
      { projectId, filters }: {
        projectId: number;
        filters?: { status?: string };
      },
    ) => {
      try {
        const features = databaseService.getFeaturesByProject(
          projectId,
          filters?.status,
        );
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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "features:get",
    async (_event, { featureId }: { featureId: number }) => {
      try {
        const feature = databaseService.getFeatureById(featureId);
        if (!feature) {
          return {
            success: false,
            error: "Feature not found",
            code: "NOT_FOUND",
          };
        }

        const tasks = databaseService.getTasksByFeature(featureId);
        const entities = databaseService.getEntitiesByFeature(featureId);

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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // Task Handlers
  // ========================================

  ipcMain.handle(
    "tasks:list",
    async (_event, { featureId }: { featureId: number }) => {
      try {
        const tasks = databaseService.getTasksByFeature(featureId);
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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // Entity Handlers
  // ========================================

  ipcMain.handle(
    "entities:list",
    async (_event, { featureId }: { featureId: number }) => {
      try {
        const entities = databaseService.getEntitiesByFeature(featureId);
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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // Stats Handlers
  // ========================================

  ipcMain.handle(
    "stats:overview",
    async (_event, { projectId }: { projectId: number }) => {
      try {
        const stats = databaseService.getProjectStats(projectId);
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
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          code: "DB_ERROR",
        };
      }
    },
  );
}

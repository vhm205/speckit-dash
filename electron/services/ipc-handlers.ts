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
import { aiProviderService } from "./ai-provider";
import { analysisService } from "./analysis-service";
import type { OllamaConfig, OpenAIConfig } from "./ai-provider";

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

  // ========================================
  // AI Provider Handlers
  // ========================================

  ipcMain.handle(
    "ai-provider:configure",
    async (
      _event,
      { provider, config }: {
        provider: "openai" | "ollama";
        config: OpenAIConfig | OllamaConfig;
      },
    ) => {
      try {
        if (provider === "openai") {
          await aiProviderService.configureOpenAI(config as OpenAIConfig);
        } else {
          await aiProviderService.configureOllama(config as OllamaConfig);
        }

        return {
          success: true,
          data: { activeProvider: provider },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Configuration failed",
          code: "CONFIG_ERROR",
        };
      }
    },
  );

  ipcMain.handle("ai-provider:get-config", async () => {
    try {
      const config = await aiProviderService.getConfig();
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get config",
        code: "CONFIG_ERROR",
      };
    }
  });

  ipcMain.handle(
    "ai-provider:switch",
    async (_event, { provider }: { provider: "openai" | "ollama" }) => {
      try {
        await aiProviderService.switchProvider(provider);
        return {
          success: true,
          data: { activeProvider: provider },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Failed to switch provider",
          code: "PROVIDER_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "ai-provider:test-connection",
    async (_event, { provider }: { provider: "openai" | "ollama" }) => {
      try {
        const result = await aiProviderService.testConnection(provider);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Connection test failed",
          code: "CONNECTION_ERROR",
        };
      }
    },
  );

  // ========================================
  // AI Analysis Handlers
  // ========================================

  ipcMain.handle(
    "ai-analysis:generate-summary",
    async (
      _event,
      { featureId, filePath }: { featureId: number; filePath: string },
    ) => {
      try {
        const result = await analysisService.generateSummary(
          featureId,
          filePath,
        );
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Summary generation failed",
          code: "AI_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "ai-analysis:check-consistency",
    async (
      _event,
      { featureId, files }: { featureId: number; files: string[] },
    ) => {
      try {
        const result = await analysisService.checkConsistency(featureId, files);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Consistency check failed",
          code: "AI_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "ai-analysis:find-gaps",
    async (
      _event,
      { featureId, filePath }: { featureId: number; filePath: string },
    ) => {
      try {
        const result = await analysisService.findGaps(featureId, filePath);
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Gap analysis failed",
          code: "AI_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "ai-analysis:get-history",
    async (
      _event,
      { featureId, analysisType, limit }: {
        featureId: number;
        analysisType?: string;
        limit?: number;
      },
    ) => {
      try {
        const history = analysisService.getAnalysisHistory(
          featureId,
          analysisType as "summary" | "consistency" | "gaps" | undefined,
          limit,
        );
        return {
          success: true,
          data: { analyses: history },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Failed to get history",
          code: "DB_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "ai-analysis:get-result",
    async (_event, { requestId }: { requestId: string }) => {
      try {
        const result = analysisService.getAnalysisResult(requestId);
        if (!result) {
          return {
            success: false,
            error: "Analysis result not found",
            code: "NOT_FOUND",
          };
        }
        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Failed to get result",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // Schema Handlers
  // ========================================

  ipcMain.handle(
    "schema:generate",
    async (_event, { featureId }: { featureId: number }) => {
      try {
        const entities = databaseService.getEntitiesByFeature(featureId);

        if (entities.length === 0) {
          return {
            success: false,
            error: "No entities found for this feature",
            code: "NO_ENTITIES",
          };
        }

        // Generate nodes for ReactFlow
        const nodes = entities.map((entity, index) => ({
          id: `entity-${entity.id}`,
          type: "entity",
          position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 150 },
          data: {
            entityName: entity.entity_name,
            description: entity.description || "",
            attributeCount: entity.attributes
              ? JSON.parse(entity.attributes).length
              : 0,
            relationshipCount: entity.relationships
              ? JSON.parse(entity.relationships).length
              : 0,
          },
        }));

        // Generate edges from relationships
        const edges: Array<{
          id: string;
          source: string;
          target: string;
          type: string;
          label: string;
        }> = [];

        for (const entity of entities) {
          if (entity.relationships) {
            const relationships = JSON.parse(entity.relationships);
            for (const rel of relationships) {
              // Find target entity
              const target = entities.find(
                (e) =>
                  e.entity_name.toLowerCase() === rel.target?.toLowerCase(),
              );
              if (target) {
                edges.push({
                  id: `edge-${entity.id}-${target.id}`,
                  source: `entity-${entity.id}`,
                  target: `entity-${target.id}`,
                  type: "smoothstep",
                  label: rel.type || "",
                });
              }
            }
          }
        }

        return {
          success: true,
          data: {
            nodes,
            edges,
            metadata: {
              entityCount: nodes.length,
              relationshipCount: edges.length,
              generatedAt: Date.now(),
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Schema generation failed",
          code: "SCHEMA_ERROR",
        };
      }
    },
  );

  ipcMain.handle(
    "schema:get-entity-details",
    async (_event, { entityId }: { entityId: number }) => {
      try {
        const entity = databaseService.getEntityById(entityId);
        if (!entity) {
          return {
            success: false,
            error: "Entity not found",
            code: "NOT_FOUND",
          };
        }

        return {
          success: true,
          data: {
            entity: {
              id: entity.id,
              entityName: entity.entity_name,
              description: entity.description,
              attributes: entity.attributes
                ? JSON.parse(entity.attributes)
                : [],
              relationships: entity.relationships
                ? JSON.parse(entity.relationships)
                : [],
              sourceFile: entity.source_file || null,
              lineNumber: entity.line_number || null,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Failed to get entity",
          code: "DB_ERROR",
        };
      }
    },
  );

  // ========================================
  // File Content Handler
  // ========================================

  ipcMain.handle(
    "files:read-spec",
    async (
      _event,
      { featureId, fileType }: {
        featureId: number;
        fileType: "spec" | "plan" | "tasks" | "data-model";
      },
    ) => {
      try {
        const feature = databaseService.getFeatureById(featureId);
        if (!feature) {
          return {
            success: false,
            error: "Feature not found",
            code: "NOT_FOUND",
          };
        }

        // Construct file path based on spec_path
        const specDir = path.dirname(feature.spec_path);
        const fileName = `${
          fileType === "data-model" ? "data-model" : fileType
        }.md`;
        const filePath = path.join(specDir, fileName);

        if (!fs.existsSync(filePath)) {
          return {
            success: false,
            error: `File not found: ${fileName}`,
            code: "FILE_NOT_FOUND",
          };
        }

        const content = fs.readFileSync(filePath, "utf-8");

        // Extract sections (basic markdown parsing)
        const sections: Array<{
          heading: string;
          level: number;
          lineStart: number;
          lineEnd: number;
        }> = [];

        const lines = content.split("\n");
        let currentSection: {
          heading: string;
          level: number;
          lineStart: number;
        } | null = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

          if (headingMatch) {
            if (currentSection) {
              sections.push({
                ...currentSection,
                lineEnd: i,
              });
            }
            currentSection = {
              heading: headingMatch[2],
              level: headingMatch[1].length,
              lineStart: i + 1,
            };
          }
        }

        if (currentSection) {
          sections.push({
            ...currentSection,
            lineEnd: lines.length,
          });
        }

        return {
          success: true,
          data: {
            content,
            sections,
            metadata: {
              title: feature.title || feature.feature_name,
              status: feature.status,
              created: feature.created_date,
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to read file",
          code: "FILE_ERROR",
        };
      }
    },
  );
}

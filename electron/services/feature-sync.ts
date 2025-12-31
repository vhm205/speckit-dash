/**
 * Speckit Dashboard - Feature Sync Service
 * Sync parsed markdown files to database
 */

import fs from "fs";
import path from "path";
import { databaseService } from "./database";
import { parseSpecContent } from "./parser/spec-parser";
import { parseTasksContent } from "./parser/tasks-parser";
import { parseDataModelContent } from "./parser/data-model-parser";
import { parsePlanContent } from "./parser/plan-parser";
import { parseResearchContent } from "./parser/research-parser";

/**
 * Scan and sync all features from a project
 */
export async function syncProjectFeatures(
  projectId: number,
  projectPath: string,
): Promise<{
  synced: number;
  errors: string[];
}> {
  const specsDir = path.join(projectPath, "specs");
  const errors: string[] = [];
  let synced = 0;

  if (!fs.existsSync(specsDir)) {
    return { synced: 0, errors: ["specs directory not found"] };
  }

  // Get all feature directories (e.g., 001-feature-name)
  const entries = fs.readdirSync(specsDir, { withFileTypes: true });
  const featureDirs = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => /^\d{3}-.+/.test(entry.name));

  for (const featureDir of featureDirs) {
    try {
      const featurePath = path.join(specsDir, featureDir.name);
      const featureNumber = featureDir.name;
      const featureName = featureDir.name.substring(4);

      // Parse spec.md if exists
      const specPath = path.join(featurePath, "spec.md");

      let specData = {
        title: featureName,
        status: "draft",
        createdDate: null as string | null,
      };
      let requirements: Array<
        {
          id: string;
          description: string;
          type: "functional" | "non_functional" | "constraint";
        }
      > = [];

      if (fs.existsSync(specPath)) {
        const content = fs.readFileSync(specPath, "utf-8");

        try {
          const parsed = await parseSpecContent(content);
          specData = {
            title: parsed.title || featureName,
            status: parsed.status,
            createdDate: parsed.createdDate,
          };

          // Extract requirements
          requirements = parsed.requirements.map((req) => ({
            id: req.id,
            description: req.description,
            type: req.id.startsWith("NFR")
              ? "non_functional" as const
              : "functional" as const,
          }));
        } catch (error) {
          console.error("Error parsing spec.md:", error);
        }
      }

      // Upsert feature
      const feature = databaseService.upsertFeature(
        projectId,
        featureNumber,
        featureName,
        specPath,
        {
          title: specData.title,
          status: specData.status,
          createdDate: specData.createdDate || undefined,
        },
      );

      // Parse and sync tasks.md if exists
      const tasksPath = path.join(featurePath, "tasks.md");
      if (fs.existsSync(tasksPath)) {
        const content = fs.readFileSync(tasksPath, "utf-8");
        const parsed = parseTasksContent(content);

        // Clear and re-sync tasks
        databaseService.deleteTasksByFeature(feature.id);

        for (const task of parsed.tasks) {
          databaseService.upsertTask(
            feature.id,
            task.taskId,
            task.description,
            task.status,
            {
              phase: task.phase || undefined,
              phaseOrder: task.phaseOrder,
              isParallel: task.isParallel,
              storyLabel: task.storyLabel || undefined,
              filePath: task.filePath || undefined,
              lineNumber: task.lineNumber,
            },
          );
        }

        // Update feature task completion
        databaseService.updateFeatureTaskCompletion(feature.id);
      }

      // Parse and sync data-model.md if exists
      const dataModelPath = path.join(featurePath, "data-model.md");
      if (fs.existsSync(dataModelPath)) {
        const content = fs.readFileSync(dataModelPath, "utf-8");
        const parsed = await parseDataModelContent(content);

        for (const entity of parsed.entities) {
          databaseService.upsertEntity(feature.id, entity.name, {
            description: entity.description || undefined,
            attributes: entity.attributes,
            relationships: entity.relationships,
            validationRules: entity.validationRules,
          });
        }
      }

      // Parse and sync requirements from spec.md
      if (requirements.length > 0) {
        // Clear existing requirements
        databaseService.deleteRequirementsByFeature(feature.id);

        for (const req of requirements) {
          databaseService.upsertRequirement(
            feature.id,
            req.id,
            req.description,
            req.type,
          );
        }
      }

      // Parse and sync plan.md if exists
      const planPath = path.join(featurePath, "plan.md");
      if (fs.existsSync(planPath)) {
        const content = fs.readFileSync(planPath, "utf-8");
        const parsed = await parsePlanContent(content);

        databaseService.upsertPlan(feature.id, {
          summary: parsed.summary || undefined,
          techStack: parsed.techStack,
          phases: parsed.phases,
          dependencies: parsed.dependencies,
          risks: parsed.risks,
        });
      }

      // Parse and sync research.md if exists
      const researchPath = path.join(featurePath, "research.md");
      if (fs.existsSync(researchPath)) {
        const content = fs.readFileSync(researchPath, "utf-8");
        const parsed = await parseResearchContent(content);

        // Clear existing research decisions
        databaseService.deleteResearchDecisionsByFeature(feature.id);

        for (const decision of parsed.decisions) {
          databaseService.upsertResearchDecision(
            feature.id,
            decision.title,
            decision.decision,
            {
              rationale: decision.rationale || undefined,
              alternatives: decision.alternatives,
              context: decision.context || undefined,
            },
          );
        }
      }

      synced++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Failed to sync ${featureDir.name}: ${errorMsg}`);
    }
  }

  return { synced, errors };
}

/**
 * Sync a single feature by file path
 */
export async function syncFeatureByPath(
  projectId: number,
  filePath: string,
): Promise<boolean> {
  // Extract feature directory from path
  const match = filePath.match(/specs[/\\](\d{3}-[^/\\]+)/);
  if (!match) return false;

  const featureDir = match[1];
  const featureNumber = featureDir;

  // Check if feature exists in database
  const feature = databaseService.getFeatureByNumber(projectId, featureNumber);
  if (!feature) {
    // Feature doesn't exist yet, trigger full sync
    const projectRoot = filePath.substring(0, filePath.indexOf("specs") - 1);
    await syncProjectFeatures(projectId, projectRoot);
    return true;
  }

  // Determine which file changed and re-parse it
  const fileName = path.basename(filePath);

  if (fileName === "spec.md" || fileName === "plan.md") {
    // For now, just update the feature status if spec changed
    // Full implementation would re-parse and update
    return true;
  }

  if (fileName === "tasks.md") {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = parseTasksContent(content);

    databaseService.deleteTasksByFeature(feature.id);

    for (const task of parsed.tasks) {
      databaseService.upsertTask(
        feature.id,
        task.taskId,
        task.description,
        task.status,
        {
          phase: task.phase || undefined,
          phaseOrder: task.phaseOrder,
          isParallel: task.isParallel,
          storyLabel: task.storyLabel || undefined,
          filePath: task.filePath || undefined,
          lineNumber: task.lineNumber,
        },
      );
    }

    databaseService.updateFeatureTaskCompletion(feature.id);
    return true;
  }

  if (fileName === "data-model.md") {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = await parseDataModelContent(content);

    for (const entity of parsed.entities) {
      databaseService.upsertEntity(feature.id, entity.name, {
        description: entity.description || undefined,
        attributes: entity.attributes,
        relationships: entity.relationships,
      });
    }
    return true;
  }

  return false;
}

export default { syncProjectFeatures, syncFeatureByPath };

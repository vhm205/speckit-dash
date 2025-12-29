"use strict";
/**
 * Speckit Dashboard - Feature Sync Service
 * Sync parsed markdown files to database
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProjectFeatures = syncProjectFeatures;
exports.syncFeatureByPath = syncFeatureByPath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const spec_parser_1 = require("./parser/spec-parser");
const tasks_parser_1 = require("./parser/tasks-parser");
const data_model_parser_1 = require("./parser/data-model-parser");
/**
 * Scan and sync all features from a project
 */
async function syncProjectFeatures(projectId, projectPath) {
    const specsDir = path_1.default.join(projectPath, "specs");
    const errors = [];
    let synced = 0;
    if (!fs_1.default.existsSync(specsDir)) {
        return { synced: 0, errors: ["specs directory not found"] };
    }
    // Get all feature directories (e.g., 001-feature-name)
    const entries = fs_1.default.readdirSync(specsDir, { withFileTypes: true });
    const featureDirs = entries
        .filter((entry) => entry.isDirectory())
        .filter((entry) => /^\d{3}-.+/.test(entry.name));
    for (const featureDir of featureDirs) {
        try {
            const featurePath = path_1.default.join(specsDir, featureDir.name);
            const featureNumber = featureDir.name.split("-")[0];
            const featureName = featureDir.name.substring(4);
            // Parse spec.md if exists
            const specPath = path_1.default.join(featurePath, "spec.md");
            let specData = {
                title: featureName,
                status: "draft",
                createdDate: null,
            };
            if (fs_1.default.existsSync(specPath)) {
                const content = fs_1.default.readFileSync(specPath, "utf-8");
                const parsed = await (0, spec_parser_1.parseSpecContent)(content);
                specData = {
                    title: parsed.title || featureName,
                    status: parsed.status,
                    createdDate: parsed.createdDate,
                };
            }
            // Upsert feature
            const feature = database_1.databaseService.upsertFeature(projectId, featureNumber, featureName, specPath, {
                title: specData.title,
                status: specData.status,
                createdDate: specData.createdDate || undefined,
            });
            // Parse and sync tasks.md if exists
            const tasksPath = path_1.default.join(featurePath, "tasks.md");
            if (fs_1.default.existsSync(tasksPath)) {
                const content = fs_1.default.readFileSync(tasksPath, "utf-8");
                const parsed = (0, tasks_parser_1.parseTasksContent)(content);
                // Clear and re-sync tasks
                database_1.databaseService.deleteTasksByFeature(feature.id);
                for (const task of parsed.tasks) {
                    database_1.databaseService.upsertTask(feature.id, task.taskId, task.description, task.status, {
                        phase: task.phase || undefined,
                        phaseOrder: task.phaseOrder,
                        isParallel: task.isParallel,
                        storyLabel: task.storyLabel || undefined,
                        filePath: task.filePath || undefined,
                        lineNumber: task.lineNumber,
                    });
                }
                // Update feature task completion
                database_1.databaseService.updateFeatureTaskCompletion(feature.id);
            }
            // Parse and sync data-model.md if exists
            const dataModelPath = path_1.default.join(featurePath, "data-model.md");
            if (fs_1.default.existsSync(dataModelPath)) {
                const content = fs_1.default.readFileSync(dataModelPath, "utf-8");
                const parsed = await (0, data_model_parser_1.parseDataModelContent)(content);
                for (const entity of parsed.entities) {
                    database_1.databaseService.upsertEntity(feature.id, entity.name, {
                        description: entity.description || undefined,
                        attributes: entity.attributes,
                        relationships: entity.relationships,
                    });
                }
            }
            synced++;
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`Failed to sync ${featureDir.name}: ${errorMsg}`);
        }
    }
    return { synced, errors };
}
/**
 * Sync a single feature by file path
 */
async function syncFeatureByPath(projectId, filePath) {
    // Extract feature directory from path
    const match = filePath.match(/specs[/\\](\d{3}-[^/\\]+)/);
    if (!match)
        return false;
    const featureDir = match[1];
    const [featureNumber] = featureDir.split("-");
    // Check if feature exists in database
    const feature = database_1.databaseService.getFeatureByNumber(projectId, featureNumber);
    if (!feature) {
        // Feature doesn't exist yet, trigger full sync
        const projectRoot = filePath.substring(0, filePath.indexOf("specs") - 1);
        await syncProjectFeatures(projectId, projectRoot);
        return true;
    }
    // Determine which file changed and re-parse it
    const fileName = path_1.default.basename(filePath);
    if (fileName === "spec.md" || fileName === "plan.md") {
        // For now, just update the feature status if spec changed
        // Full implementation would re-parse and update
        return true;
    }
    if (fileName === "tasks.md") {
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        const parsed = (0, tasks_parser_1.parseTasksContent)(content);
        database_1.databaseService.deleteTasksByFeature(feature.id);
        for (const task of parsed.tasks) {
            database_1.databaseService.upsertTask(feature.id, task.taskId, task.description, task.status, {
                phase: task.phase || undefined,
                phaseOrder: task.phaseOrder,
                isParallel: task.isParallel,
                storyLabel: task.storyLabel || undefined,
                filePath: task.filePath || undefined,
                lineNumber: task.lineNumber,
            });
        }
        database_1.databaseService.updateFeatureTaskCompletion(feature.id);
        return true;
    }
    if (fileName === "data-model.md") {
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        const parsed = await (0, data_model_parser_1.parseDataModelContent)(content);
        for (const entity of parsed.entities) {
            database_1.databaseService.upsertEntity(feature.id, entity.name, {
                description: entity.description || undefined,
                attributes: entity.attributes,
                relationships: entity.relationships,
            });
        }
        return true;
    }
    return false;
}
exports.default = { syncProjectFeatures, syncFeatureByPath };

"use strict";
/**
 * Speckit Dashboard - Database Service
 * SQLite database operations with WAL mode and connection management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class DatabaseService {
    db = null;
    dbPath;
    constructor() {
        // Use app data directory for persistent storage
        const userDataPath = electron_1.app.getPath("userData");
        const dbDir = path_1.default.join(userDataPath, "speckit-dash");
        // Ensure directory exists
        if (!fs_1.default.existsSync(dbDir)) {
            fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        this.dbPath = path_1.default.join(dbDir, "data.db");
    }
    /**
     * Initialize the database connection and create schema
     */
    initialize() {
        if (this.db)
            return;
        this.db = new better_sqlite3_1.default(this.dbPath);
        // Enable WAL mode for better performance
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");
        // Read and execute schema
        // When compiled, __dirname is dist-electron/services/, so go up 2 levels to project root
        const schemaPath = path_1.default.join(__dirname, "..", "..", "electron", "utils", "db-schema.sql");
        const schema = fs_1.default.readFileSync(schemaPath, "utf-8");
        // Execute each statement
        const statements = schema.split(";").filter((s) => s.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                this.db.exec(stmt);
            }
        }
    }
    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    // ========================================
    // Project Operations
    // ========================================
    createProject(name, rootPath) {
        const now = Date.now();
        const stmt = this.db.prepare(`
      INSERT INTO projects (name, root_path, last_opened_at, created_at)
      VALUES (?, ?, ?, ?)
    `);
        const result = stmt.run(name, rootPath, now, now);
        return {
            id: result.lastInsertRowid,
            name,
            root_path: rootPath,
            last_opened_at: now,
            created_at: now,
        };
    }
    getProjectById(id) {
        const stmt = this.db.prepare("SELECT * FROM projects WHERE id = ?");
        return stmt.get(id);
    }
    getProjectByPath(rootPath) {
        const stmt = this.db.prepare("SELECT * FROM projects WHERE root_path = ?");
        return stmt.get(rootPath);
    }
    getAllProjects() {
        const stmt = this.db.prepare("SELECT * FROM projects ORDER BY last_opened_at DESC");
        return stmt.all();
    }
    updateProjectLastOpened(id) {
        const stmt = this.db.prepare("UPDATE projects SET last_opened_at = ? WHERE id = ?");
        stmt.run(Date.now(), id);
    }
    deleteProject(id) {
        const stmt = this.db.prepare("DELETE FROM projects WHERE id = ?");
        stmt.run(id);
    }
    // ========================================
    // Feature Operations
    // ========================================
    upsertFeature(projectId, featureNumber, featureName, specPath, options) {
        const now = Date.now();
        const existing = this.getFeatureByNumber(projectId, featureNumber);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE features SET 
          feature_name = ?, title = ?, status = ?, priority = ?,
          created_date = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(featureName, options?.title ?? existing.title, options?.status ?? existing.status, options?.priority ?? existing.priority, options?.createdDate ?? existing.created_date, now, existing.id);
            return this.getFeatureById(existing.id);
        }
        const stmt = this.db.prepare(`
      INSERT INTO features (
        project_id, feature_number, feature_name, title, status,
        spec_path, priority, created_date, task_completion_pct, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);
        const result = stmt.run(projectId, featureNumber, featureName, options?.title ?? null, options?.status ?? "draft", specPath, options?.priority ?? null, options?.createdDate ?? null, now, now);
        return this.getFeatureById(result.lastInsertRowid);
    }
    getFeatureById(id) {
        const stmt = this.db.prepare("SELECT * FROM features WHERE id = ?");
        return stmt.get(id);
    }
    getFeatureByNumber(projectId, featureNumber) {
        const stmt = this.db.prepare("SELECT * FROM features WHERE project_id = ? AND feature_number = ?");
        return stmt.get(projectId, featureNumber);
    }
    getFeaturesByProject(projectId, status) {
        if (status) {
            const stmt = this.db.prepare("SELECT * FROM features WHERE project_id = ? AND status = ? ORDER BY feature_number");
            return stmt.all(projectId, status);
        }
        const stmt = this.db.prepare("SELECT * FROM features WHERE project_id = ? ORDER BY feature_number");
        return stmt.all(projectId);
    }
    updateFeatureTaskCompletion(featureId) {
        const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks WHERE feature_id = ?
    `).get(featureId);
        const pct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
        this.db.prepare("UPDATE features SET task_completion_pct = ?, updated_at = ? WHERE id = ?").run(pct, Date.now(), featureId);
    }
    deleteFeature(id) {
        const stmt = this.db.prepare("DELETE FROM features WHERE id = ?");
        stmt.run(id);
    }
    // ========================================
    // Task Operations
    // ========================================
    upsertTask(featureId, taskId, description, status, options) {
        const now = Date.now();
        const existing = this.getTaskByTaskId(featureId, taskId);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE tasks SET 
          description = ?, status = ?, phase = ?, phase_order = ?,
          is_parallel = ?, dependencies = ?, story_label = ?,
          file_path = ?, line_number = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(description, status, options?.phase ?? existing.phase, options?.phaseOrder ?? existing.phase_order, options?.isParallel ? 1 : 0, options?.dependencies
                ? JSON.stringify(options.dependencies)
                : existing.dependencies, options?.storyLabel ?? existing.story_label, options?.filePath ?? existing.file_path, options?.lineNumber ?? existing.line_number, now, existing.id);
            return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id);
        }
        const stmt = this.db.prepare(`
      INSERT INTO tasks (
        feature_id, task_id, description, status, phase, phase_order,
        is_parallel, dependencies, story_label, file_path, line_number,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, taskId, description, status, options?.phase ?? null, options?.phaseOrder ?? null, options?.isParallel ? 1 : 0, options?.dependencies ? JSON.stringify(options.dependencies) : null, options?.storyLabel ?? null, options?.filePath ?? null, options?.lineNumber ?? null, now, now);
        return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    }
    getTaskByTaskId(featureId, taskId) {
        const stmt = this.db.prepare("SELECT * FROM tasks WHERE feature_id = ? AND task_id = ?");
        return stmt.get(featureId, taskId);
    }
    getTasksByFeature(featureId) {
        const stmt = this.db.prepare("SELECT * FROM tasks WHERE feature_id = ? ORDER BY phase_order, task_id");
        return stmt.all(featureId);
    }
    deleteTasksByFeature(featureId) {
        this.db.prepare("DELETE FROM tasks WHERE feature_id = ?").run(featureId);
    }
    // ========================================
    // Entity Operations
    // ========================================
    upsertEntity(featureId, entityName, options) {
        const now = Date.now();
        const existing = this.getEntityByName(featureId, entityName);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE entities SET 
          description = ?, attributes = ?, relationships = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(options?.description ?? existing.description, options?.attributes
                ? JSON.stringify(options.attributes)
                : existing.attributes, options?.relationships
                ? JSON.stringify(options.relationships)
                : existing.relationships, now, existing.id);
            return this.db.prepare("SELECT * FROM entities WHERE id = ?").get(existing.id);
        }
        const stmt = this.db.prepare(`
      INSERT INTO entities (
        feature_id, entity_name, description, attributes, relationships,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, entityName, options?.description ?? null, options?.attributes ? JSON.stringify(options.attributes) : null, options?.relationships ? JSON.stringify(options.relationships) : null, now, now);
        return this.db.prepare("SELECT * FROM entities WHERE id = ?").get(result.lastInsertRowid);
    }
    getEntityByName(featureId, entityName) {
        const stmt = this.db.prepare("SELECT * FROM entities WHERE feature_id = ? AND entity_name = ?");
        return stmt.get(featureId, entityName);
    }
    getEntitiesByFeature(featureId) {
        const stmt = this.db.prepare("SELECT * FROM entities WHERE feature_id = ? ORDER BY entity_name");
        return stmt.all(featureId);
    }
    // ========================================
    // Stats Aggregation
    // ========================================
    getProjectStats(projectId) {
        // Feature stats
        const featureStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete,
        AVG(task_completion_pct) as avg_completion
      FROM features WHERE project_id = ?
    `).get(projectId);
        // Task stats
        const taskStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'not_started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks t
      JOIN features f ON t.feature_id = f.id
      WHERE f.project_id = ?
    `).get(projectId);
        return {
            totalFeatures: featureStats.total,
            featuresByStatus: {
                draft: featureStats.draft,
                approved: featureStats.approved,
                in_progress: featureStats.in_progress,
                complete: featureStats.complete,
            },
            avgTaskCompletion: featureStats.avg_completion ?? 0,
            totalTasks: taskStats.total,
            tasksByStatus: {
                not_started: taskStats.not_started,
                in_progress: taskStats.in_progress,
                done: taskStats.done,
            },
        };
    }
}
// Export singleton instance
exports.databaseService = new DatabaseService();
exports.default = exports.databaseService;

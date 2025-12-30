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
        // When compiled, __dirname is dist-electron/services/
        // We need to resolve to where the source files are or where the schema is copied
        // For development with electron-vite/ts, we can try relative to project root
        const schemaPath = path_1.default.join(__dirname, "..", // dist-electron
        "..", // root
        "electron", "utils", "db-schema.sql");
        const schema = fs_1.default.readFileSync(schemaPath, "utf-8");
        // Execute each statement
        const statements = schema.split(";").filter((s) => s.trim());
        for (const stmt of statements) {
            if (stmt.trim()) {
                this.db.exec(stmt);
            }
        }
        // Ensure analysis_results table exists (as a migration/safeguard)
        this.ensureAnalysisResultsTable();
        // Ensure architecture_analysis table exists
        this.ensureArchitectureAnalysisTable();
    }
    /**
     * Ensure the architecture_analysis table exists
     */
    ensureArchitectureAnalysisTable() {
        if (!this.db)
            return;
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS architecture_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id INTEGER NOT NULL UNIQUE,
        request_id TEXT NOT NULL,
        actors TEXT NOT NULL,
        systems TEXT NOT NULL,
        processes TEXT NOT NULL,
        data_stores TEXT NOT NULL,
        connections TEXT NOT NULL,
        duration INTEGER NOT NULL,
        token_count INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_architecture_feature ON architecture_analysis(feature_id);
    `);
    }
    /**
     * Ensure the analysis_results table exists
     */
    ensureAnalysisResultsTable() {
        if (!this.db)
            return;
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT UNIQUE NOT NULL,
        feature_id INTEGER NOT NULL,
        file_path TEXT,
        analysis_type TEXT NOT NULL CHECK(analysis_type IN ('summary', 'consistency', 'gaps')),
        content TEXT NOT NULL,
        token_count INTEGER,
        duration INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_analysis_feature ON analysis_results(feature_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_request ON analysis_results(request_id);
    `);
        // Check if file_path column exists (migration)
        const info = this.db.prepare("PRAGMA table_info(analysis_results)")
            .all();
        const hasFilePath = info.some((col) => col.name === "file_path");
        if (!hasFilePath) {
            try {
                this.db.exec("ALTER TABLE analysis_results ADD COLUMN file_path TEXT");
            }
            catch (err) {
                console.error("Failed to add file_path column to analysis_results", err);
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
          description = ?, attributes = ?, relationships = ?, validation_rules = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(options?.description ?? existing.description, options?.attributes
                ? JSON.stringify(options.attributes)
                : existing.attributes, options?.relationships
                ? JSON.stringify(options.relationships)
                : existing.relationships, options?.validationRules
                ? JSON.stringify(options.validationRules)
                : existing.validation_rules, now, existing.id);
            return this.db.prepare("SELECT * FROM entities WHERE id = ?").get(existing.id);
        }
        const stmt = this.db.prepare(`
      INSERT INTO entities (
        feature_id, entity_name, description, attributes, relationships, validation_rules,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, entityName, options?.description ?? null, options?.attributes ? JSON.stringify(options.attributes) : null, options?.relationships ? JSON.stringify(options.relationships) : null, options?.validationRules ? JSON.stringify(options.validationRules) : null, now, now);
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
    // Requirement Operations
    // ========================================
    upsertRequirement(featureId, requirementId, description, type, options) {
        const now = Date.now();
        const existing = this.getRequirementByRequirementId(featureId, requirementId);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE requirements SET 
          description = ?, type = ?, priority = ?, 
          linked_tasks = ?, acceptance_criteria = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(description, type, options?.priority ?? existing.priority, options?.linkedTasks
                ? JSON.stringify(options.linkedTasks)
                : existing.linked_tasks, options?.acceptanceCriteria
                ? JSON.stringify(options.acceptanceCriteria)
                : existing.acceptance_criteria, now, existing.id);
            return { id: existing.id };
        }
        const stmt = this.db.prepare(`
      INSERT INTO requirements (
        feature_id, requirement_id, description, type, priority,
        linked_tasks, acceptance_criteria, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, requirementId, description, type, options?.priority ?? null, options?.linkedTasks ? JSON.stringify(options.linkedTasks) : null, options?.acceptanceCriteria
            ? JSON.stringify(options.acceptanceCriteria)
            : null, now, now);
        return { id: result.lastInsertRowid };
    }
    getRequirementByRequirementId(featureId, requirementId) {
        const stmt = this.db.prepare("SELECT * FROM requirements WHERE feature_id = ? AND requirement_id = ?");
        return stmt.get(featureId, requirementId);
    }
    getRequirementsByFeature(featureId) {
        const stmt = this.db.prepare("SELECT * FROM requirements WHERE feature_id = ? ORDER BY requirement_id");
        return stmt.all(featureId);
    }
    deleteRequirementsByFeature(featureId) {
        this.db.prepare("DELETE FROM requirements WHERE feature_id = ?").run(featureId);
    }
    // ========================================
    // Research Decision Operations
    // ========================================
    upsertResearchDecision(featureId, title, decision, options) {
        const now = Date.now();
        // Check for existing by title
        const existing = this.db.prepare("SELECT * FROM research_decisions WHERE feature_id = ? AND title = ?").get(featureId, title);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE research_decisions SET 
          decision = ?, rationale = ?, alternatives = ?, context = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(decision, options?.rationale ?? null, options?.alternatives ? JSON.stringify(options.alternatives) : null, options?.context ?? null, now, existing.id);
            return { id: existing.id };
        }
        const stmt = this.db.prepare(`
      INSERT INTO research_decisions (
        feature_id, title, decision, rationale, alternatives, context,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, title, decision, options?.rationale ?? null, options?.alternatives ? JSON.stringify(options.alternatives) : null, options?.context ?? null, now, now);
        return { id: result.lastInsertRowid };
    }
    getResearchDecisionsByFeature(featureId) {
        const stmt = this.db.prepare("SELECT * FROM research_decisions WHERE feature_id = ? ORDER BY created_at");
        return stmt.all(featureId);
    }
    deleteResearchDecisionsByFeature(featureId) {
        this.db.prepare("DELETE FROM research_decisions WHERE feature_id = ?").run(featureId);
    }
    // ========================================
    // Plan Operations
    // ========================================
    upsertPlan(featureId, options) {
        const now = Date.now();
        const existing = this.getPlanByFeature(featureId);
        if (existing) {
            const stmt = this.db.prepare(`
        UPDATE plans SET 
          summary = ?, tech_stack = ?, phases = ?, dependencies = ?, risks = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(options?.summary ?? existing.summary, options?.techStack
                ? JSON.stringify(options.techStack)
                : existing.tech_stack, options?.phases ? JSON.stringify(options.phases) : existing.phases, options?.dependencies
                ? JSON.stringify(options.dependencies)
                : existing.dependencies, options?.risks ? JSON.stringify(options.risks) : existing.risks, now, existing.id);
            return { id: existing.id };
        }
        const stmt = this.db.prepare(`
      INSERT INTO plans (
        feature_id, summary, tech_stack, phases, dependencies, risks,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, options?.summary ?? null, options?.techStack ? JSON.stringify(options.techStack) : null, options?.phases ? JSON.stringify(options.phases) : null, options?.dependencies ? JSON.stringify(options.dependencies) : null, options?.risks ? JSON.stringify(options.risks) : null, now, now);
        return { id: result.lastInsertRowid };
    }
    getPlanByFeature(featureId) {
        const stmt = this.db.prepare("SELECT * FROM plans WHERE feature_id = ?");
        return stmt.get(featureId);
    }
    deletePlanByFeature(featureId) {
        this.db.prepare("DELETE FROM plans WHERE feature_id = ?").run(featureId);
    }
    /**
     * Get entity by ID with detailed information
     */
    getEntityById(entityId) {
        const stmt = this.db.prepare("SELECT * FROM entities WHERE id = ?");
        const result = stmt.get(entityId);
        return result ? {
            ...result,
            line_number: result.line_number ?? null,
        } : null;
    }
    // ========================================
    // Architecture Analysis Operations
    // ========================================
    /**
     * Save or update architecture analysis for a feature
     */
    saveArchitectureAnalysis(featureId, requestId, actors, systems, processes, dataStores, connections, duration, tokenCount) {
        const now = Date.now();
        const existing = this.getArchitectureAnalysis(featureId);
        if (existing) {
            // Update existing
            const stmt = this.db.prepare(`
        UPDATE architecture_analysis SET 
          request_id = ?, actors = ?, systems = ?, processes = ?,
          data_stores = ?, connections = ?, duration = ?, token_count = ?,
          updated_at = ?
        WHERE feature_id = ?
      `);
            stmt.run(requestId, JSON.stringify(actors), JSON.stringify(systems), JSON.stringify(processes), JSON.stringify(dataStores), JSON.stringify(connections), duration, tokenCount ?? null, now, featureId);
            return { id: existing.id };
        }
        // Insert new
        const stmt = this.db.prepare(`
      INSERT INTO architecture_analysis (
        feature_id, request_id, actors, systems, processes,
        data_stores, connections, duration, token_count,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(featureId, requestId, JSON.stringify(actors), JSON.stringify(systems), JSON.stringify(processes), JSON.stringify(dataStores), JSON.stringify(connections), duration, tokenCount ?? null, now, now);
        return { id: result.lastInsertRowid };
    }
    /**
     * Get architecture analysis for a feature
     */
    getArchitectureAnalysis(featureId) {
        const stmt = this.db.prepare(`
      SELECT * FROM architecture_analysis WHERE feature_id = ?
    `);
        return stmt.get(featureId);
    }
    /**
     * Delete architecture analysis for a feature
     */
    deleteArchitectureAnalysis(featureId) {
        const stmt = this.db.prepare("DELETE FROM architecture_analysis WHERE feature_id = ?");
        stmt.run(featureId);
    }
    // ========================================
    // Migration Support
    // ========================================
    // ========================================
    // Feature Description Operations
    // ========================================
    updateFeatureDescription(featureId, description) {
        const stmt = this.db.prepare("UPDATE features SET description = ?, updated_at = ? WHERE id = ?");
        stmt.run(description, Date.now(), featureId);
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
    // ========================================
    // Analysis Results Operations
    // ========================================
    /**
     * Create a new analysis result record
     */
    createAnalysisResult(requestId, featureId, analysisType, content, duration, tokenCount, filePath) {
        const stmt = this.db.prepare(`
      INSERT INTO analysis_results (
        request_id, feature_id, analysis_type, content, token_count, duration, file_path, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const result = stmt.run(requestId, featureId, analysisType, content, tokenCount ?? null, duration, filePath ?? null, Date.now());
        return { id: result.lastInsertRowid, requestId };
    }
    /**
     * Get analysis result by request ID
     */
    getAnalysisResultByRequestId(requestId) {
        const stmt = this.db.prepare("SELECT * FROM analysis_results WHERE request_id = ?");
        return stmt.get(requestId);
    }
    /**
     * Get analysis results by feature with optional type filter
     */
    getAnalysisResultsByFeature(featureId, analysisType, limit = 10) {
        if (analysisType) {
            const stmt = this.db.prepare(`
        SELECT * FROM analysis_results 
        WHERE feature_id = ? AND analysis_type = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
            return stmt.all(featureId, analysisType, limit);
        }
        const stmt = this.db.prepare(`
      SELECT * FROM analysis_results 
      WHERE feature_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
        return stmt.all(featureId, limit);
    }
    /**
     * Get the latest analysis result for a specific feature, type, and optional file
     */
    getLatestAnalysisResult(featureId, analysisType, filePath) {
        if (filePath) {
            const stmt = this.db.prepare(`
          SELECT * FROM analysis_results 
          WHERE feature_id = ? AND analysis_type = ? AND file_path = ?
          ORDER BY created_at DESC
          LIMIT 1
        `);
            return stmt.get(featureId, analysisType, filePath) ?? null;
        }
        const stmt = this.db.prepare(`
        SELECT * FROM analysis_results 
        WHERE feature_id = ? AND analysis_type = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
        return stmt.get(featureId, analysisType) ?? null;
    }
    /**
     * Delete analysis results for a feature
     */
    deleteAnalysisResultsByFeature(featureId) {
        this.db.prepare("DELETE FROM analysis_results WHERE feature_id = ?").run(featureId);
    }
    // ========================================
    // Enhanced Entity Operations (with source tracking)
    // ========================================
    /**
     * Update entity with source file tracking
     */
    updateEntitySource(entityId, sourceFile, lineNumber) {
        const stmt = this.db.prepare(`
      UPDATE entities 
      SET source_file = ?, line_number = ?, updated_at = ?
      WHERE id = ?
    `);
        stmt.run(sourceFile, lineNumber, Date.now(), entityId);
    }
    // ========================================
    // Migration Support
    // ========================================
    /**
     * Run a migration if not already applied
     */
    runMigration(migrationFn) {
        if (this.db) {
            migrationFn(this.db);
        }
    }
    /**
     * Check if analysis_results table exists
     */
    hasAnalysisResultsTable() {
        try {
            const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='analysis_results'
      `).all();
            return tables.length > 0;
        }
        catch {
            return false;
        }
    }
}
// Export singleton instance
exports.databaseService = new DatabaseService();
exports.default = exports.databaseService;

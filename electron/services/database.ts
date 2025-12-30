/**
 * Speckit Dashboard - Database Service
 * SQLite database operations with WAL mode and connection management
 */

import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

// Types
interface DbProject {
  id: number;
  name: string;
  root_path: string;
  last_opened_at: number;
  created_at: number;
}

interface DbFeature {
  id: number;
  project_id: number;
  feature_number: string;
  feature_name: string;
  title: string | null;
  status: string;
  spec_path: string;
  priority: string | null;
  created_date: string | null;
  task_completion_pct: number;
  created_at: number;
  updated_at: number;
}

interface DbTask {
  id: number;
  feature_id: number;
  task_id: string;
  description: string;
  status: string;
  phase: string | null;
  phase_order: number | null;
  is_parallel: number;
  dependencies: string | null;
  story_label: string | null;
  file_path: string | null;
  line_number: number | null;
  created_at: number;
  updated_at: number;
}

interface DbEntity {
  id: number;
  feature_id: number;
  entity_name: string;
  description: string | null;
  attributes: string | null;
  relationships: string | null;
  validation_rules: string | null;
  state_transitions: string | null;
  created_at: number;
  updated_at: number;
}

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    // Use app data directory for persistent storage
    const userDataPath = app.getPath("userData");
    const dbDir = path.join(userDataPath, "speckit-dash");

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, "data.db");
  }

  /**
   * Initialize the database connection and create schema
   */
  initialize(): void {
    if (this.db) return;

    this.db = new Database(this.dbPath);

    // Enable WAL mode for better performance
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    // Read and execute schema
    // When compiled, __dirname is dist-electron/services/
    // We need to resolve to where the source files are or where the schema is copied
    // For development with electron-vite/ts, we can try relative to project root
    const schemaPath = path.join(
      __dirname,
      "..", // dist-electron
      "..", // root
      "electron",
      "utils",
      "db-schema.sql",
    );
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute each statement
    const statements = schema.split(";").filter((s) => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        this.db.exec(stmt);
      }
    }

    // Ensure analysis_results table exists (as a migration/safeguard)
    this.ensureAnalysisResultsTable();
  }

  /**
   * Ensure the analysis_results table exists
   */
  private ensureAnalysisResultsTable(): void {
    if (!this.db) return;

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
      .all() as any[];
    const hasFilePath = info.some((col) => col.name === "file_path");

    if (!hasFilePath) {
      try {
        this.db.exec("ALTER TABLE analysis_results ADD COLUMN file_path TEXT");
      } catch (err) {
        console.error(
          "Failed to add file_path column to analysis_results",
          err,
        );
      }
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ========================================
  // Project Operations
  // ========================================

  createProject(name: string, rootPath: string): DbProject {
    const now = Date.now();
    const stmt = this.db!.prepare(`
      INSERT INTO projects (name, root_path, last_opened_at, created_at)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, rootPath, now, now);

    return {
      id: result.lastInsertRowid as number,
      name,
      root_path: rootPath,
      last_opened_at: now,
      created_at: now,
    };
  }

  getProjectById(id: number): DbProject | null {
    const stmt = this.db!.prepare("SELECT * FROM projects WHERE id = ?");
    return stmt.get(id) as DbProject | null;
  }

  getProjectByPath(rootPath: string): DbProject | null {
    const stmt = this.db!.prepare("SELECT * FROM projects WHERE root_path = ?");
    return stmt.get(rootPath) as DbProject | null;
  }

  getAllProjects(): DbProject[] {
    const stmt = this.db!.prepare(
      "SELECT * FROM projects ORDER BY last_opened_at DESC",
    );
    return stmt.all() as DbProject[];
  }

  updateProjectLastOpened(id: number): void {
    const stmt = this.db!.prepare(
      "UPDATE projects SET last_opened_at = ? WHERE id = ?",
    );
    stmt.run(Date.now(), id);
  }

  deleteProject(id: number): void {
    const stmt = this.db!.prepare("DELETE FROM projects WHERE id = ?");
    stmt.run(id);
  }

  // ========================================
  // Feature Operations
  // ========================================

  upsertFeature(
    projectId: number,
    featureNumber: string,
    featureName: string,
    specPath: string,
    options?: {
      title?: string;
      status?: string;
      priority?: string;
      createdDate?: string;
    },
  ): DbFeature {
    const now = Date.now();
    const existing = this.getFeatureByNumber(projectId, featureNumber);

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE features SET 
          feature_name = ?, title = ?, status = ?, priority = ?,
          created_date = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        featureName,
        options?.title ?? existing.title,
        options?.status ?? existing.status,
        options?.priority ?? existing.priority,
        options?.createdDate ?? existing.created_date,
        now,
        existing.id,
      );
      return this.getFeatureById(existing.id)!;
    }

    const stmt = this.db!.prepare(`
      INSERT INTO features (
        project_id, feature_number, feature_name, title, status,
        spec_path, priority, created_date, task_completion_pct, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `);
    const result = stmt.run(
      projectId,
      featureNumber,
      featureName,
      options?.title ?? null,
      options?.status ?? "draft",
      specPath,
      options?.priority ?? null,
      options?.createdDate ?? null,
      now,
      now,
    );

    return this.getFeatureById(result.lastInsertRowid as number)!;
  }

  getFeatureById(id: number): DbFeature | null {
    const stmt = this.db!.prepare("SELECT * FROM features WHERE id = ?");
    return stmt.get(id) as DbFeature | null;
  }

  getFeatureByNumber(
    projectId: number,
    featureNumber: string,
  ): DbFeature | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM features WHERE project_id = ? AND feature_number = ?",
    );
    return stmt.get(projectId, featureNumber) as DbFeature | null;
  }

  getFeaturesByProject(projectId: number, status?: string): DbFeature[] {
    if (status) {
      const stmt = this.db!.prepare(
        "SELECT * FROM features WHERE project_id = ? AND status = ? ORDER BY feature_number",
      );
      return stmt.all(projectId, status) as DbFeature[];
    }
    const stmt = this.db!.prepare(
      "SELECT * FROM features WHERE project_id = ? ORDER BY feature_number",
    );
    return stmt.all(projectId) as DbFeature[];
  }

  updateFeatureTaskCompletion(featureId: number): void {
    const stats = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks WHERE feature_id = ?
    `).get(featureId) as { total: number; done: number };

    const pct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;
    this.db!.prepare(
      "UPDATE features SET task_completion_pct = ?, updated_at = ? WHERE id = ?",
    ).run(
      pct,
      Date.now(),
      featureId,
    );
  }

  deleteFeature(id: number): void {
    const stmt = this.db!.prepare("DELETE FROM features WHERE id = ?");
    stmt.run(id);
  }

  // ========================================
  // Task Operations
  // ========================================

  upsertTask(
    featureId: number,
    taskId: string,
    description: string,
    status: string,
    options?: {
      phase?: string;
      phaseOrder?: number;
      isParallel?: boolean;
      dependencies?: string[];
      storyLabel?: string;
      filePath?: string;
      lineNumber?: number;
    },
  ): DbTask {
    const now = Date.now();
    const existing = this.getTaskByTaskId(featureId, taskId);

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE tasks SET 
          description = ?, status = ?, phase = ?, phase_order = ?,
          is_parallel = ?, dependencies = ?, story_label = ?,
          file_path = ?, line_number = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        description,
        status,
        options?.phase ?? existing.phase,
        options?.phaseOrder ?? existing.phase_order,
        options?.isParallel ? 1 : 0,
        options?.dependencies
          ? JSON.stringify(options.dependencies)
          : existing.dependencies,
        options?.storyLabel ?? existing.story_label,
        options?.filePath ?? existing.file_path,
        options?.lineNumber ?? existing.line_number,
        now,
        existing.id,
      );
      return this.db!.prepare("SELECT * FROM tasks WHERE id = ?").get(
        existing.id,
      ) as DbTask;
    }

    const stmt = this.db!.prepare(`
      INSERT INTO tasks (
        feature_id, task_id, description, status, phase, phase_order,
        is_parallel, dependencies, story_label, file_path, line_number,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      featureId,
      taskId,
      description,
      status,
      options?.phase ?? null,
      options?.phaseOrder ?? null,
      options?.isParallel ? 1 : 0,
      options?.dependencies ? JSON.stringify(options.dependencies) : null,
      options?.storyLabel ?? null,
      options?.filePath ?? null,
      options?.lineNumber ?? null,
      now,
      now,
    );

    return this.db!.prepare("SELECT * FROM tasks WHERE id = ?").get(
      result.lastInsertRowid,
    ) as DbTask;
  }

  getTaskByTaskId(featureId: number, taskId: string): DbTask | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM tasks WHERE feature_id = ? AND task_id = ?",
    );
    return stmt.get(featureId, taskId) as DbTask | null;
  }

  getTasksByFeature(featureId: number): DbTask[] {
    const stmt = this.db!.prepare(
      "SELECT * FROM tasks WHERE feature_id = ? ORDER BY phase_order, task_id",
    );
    return stmt.all(featureId) as DbTask[];
  }

  deleteTasksByFeature(featureId: number): void {
    this.db!.prepare("DELETE FROM tasks WHERE feature_id = ?").run(featureId);
  }

  // ========================================
  // Entity Operations
  // ========================================

  upsertEntity(
    featureId: number,
    entityName: string,
    options?: {
      description?: string;
      attributes?: unknown[];
      relationships?: unknown[];
    },
  ): DbEntity {
    const now = Date.now();
    const existing = this.getEntityByName(featureId, entityName);

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE entities SET 
          description = ?, attributes = ?, relationships = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        options?.description ?? existing.description,
        options?.attributes
          ? JSON.stringify(options.attributes)
          : existing.attributes,
        options?.relationships
          ? JSON.stringify(options.relationships)
          : existing.relationships,
        now,
        existing.id,
      );
      return this.db!.prepare("SELECT * FROM entities WHERE id = ?").get(
        existing.id,
      ) as DbEntity;
    }

    const stmt = this.db!.prepare(`
      INSERT INTO entities (
        feature_id, entity_name, description, attributes, relationships,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      featureId,
      entityName,
      options?.description ?? null,
      options?.attributes ? JSON.stringify(options.attributes) : null,
      options?.relationships ? JSON.stringify(options.relationships) : null,
      now,
      now,
    );

    return this.db!.prepare("SELECT * FROM entities WHERE id = ?").get(
      result.lastInsertRowid,
    ) as DbEntity;
  }

  getEntityByName(featureId: number, entityName: string): DbEntity | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM entities WHERE feature_id = ? AND entity_name = ?",
    );
    return stmt.get(featureId, entityName) as DbEntity | null;
  }

  getEntitiesByFeature(featureId: number): DbEntity[] {
    const stmt = this.db!.prepare(
      "SELECT * FROM entities WHERE feature_id = ? ORDER BY entity_name",
    );
    return stmt.all(featureId) as DbEntity[];
  }

  // ========================================
  // Requirement Operations
  // ========================================

  upsertRequirement(
    featureId: number,
    requirementId: string,
    description: string,
    type: "functional" | "non_functional" | "constraint",
    options?: {
      priority?: string;
      linkedTasks?: string[];
      acceptanceCriteria?: string[];
    },
  ): { id: number } {
    const now = Date.now();
    const existing = this.getRequirementByRequirementId(
      featureId,
      requirementId,
    );

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE requirements SET 
          description = ?, type = ?, priority = ?, 
          linked_tasks = ?, acceptance_criteria = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        description,
        type,
        options?.priority ?? existing.priority,
        options?.linkedTasks
          ? JSON.stringify(options.linkedTasks)
          : existing.linked_tasks,
        options?.acceptanceCriteria
          ? JSON.stringify(options.acceptanceCriteria)
          : existing.acceptance_criteria,
        now,
        existing.id,
      );
      return { id: existing.id };
    }

    const stmt = this.db!.prepare(`
      INSERT INTO requirements (
        feature_id, requirement_id, description, type, priority,
        linked_tasks, acceptance_criteria, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      featureId,
      requirementId,
      description,
      type,
      options?.priority ?? null,
      options?.linkedTasks ? JSON.stringify(options.linkedTasks) : null,
      options?.acceptanceCriteria
        ? JSON.stringify(options.acceptanceCriteria)
        : null,
      now,
      now,
    );

    return { id: result.lastInsertRowid as number };
  }

  getRequirementByRequirementId(featureId: number, requirementId: string): {
    id: number;
    feature_id: number;
    requirement_id: string;
    type: string;
    description: string;
    priority: string | null;
    linked_tasks: string | null;
    acceptance_criteria: string | null;
    created_at: number;
    updated_at: number;
  } | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM requirements WHERE feature_id = ? AND requirement_id = ?",
    );
    return stmt.get(featureId, requirementId) as {
      id: number;
      feature_id: number;
      requirement_id: string;
      type: string;
      description: string;
      priority: string | null;
      linked_tasks: string | null;
      acceptance_criteria: string | null;
      created_at: number;
      updated_at: number;
    } | null;
  }

  getRequirementsByFeature(featureId: number): Array<{
    id: number;
    feature_id: number;
    requirement_id: string;
    type: string;
    description: string;
    priority: string | null;
    linked_tasks: string | null;
    acceptance_criteria: string | null;
    created_at: number;
    updated_at: number;
  }> {
    const stmt = this.db!.prepare(
      "SELECT * FROM requirements WHERE feature_id = ? ORDER BY requirement_id",
    );
    return stmt.all(featureId) as Array<{
      id: number;
      feature_id: number;
      requirement_id: string;
      type: string;
      description: string;
      priority: string | null;
      linked_tasks: string | null;
      acceptance_criteria: string | null;
      created_at: number;
      updated_at: number;
    }>;
  }

  deleteRequirementsByFeature(featureId: number): void {
    this.db!.prepare("DELETE FROM requirements WHERE feature_id = ?").run(
      featureId,
    );
  }

  // ========================================
  // Research Decision Operations
  // ========================================

  upsertResearchDecision(
    featureId: number,
    title: string,
    decision: string,
    options?: {
      rationale?: string;
      alternatives?: string[];
      context?: string;
    },
  ): { id: number } {
    const now = Date.now();

    // Check for existing by title
    const existing = this.db!.prepare(
      "SELECT * FROM research_decisions WHERE feature_id = ? AND title = ?",
    ).get(featureId, title) as { id: number } | undefined;

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE research_decisions SET 
          decision = ?, rationale = ?, alternatives = ?, context = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        decision,
        options?.rationale ?? null,
        options?.alternatives ? JSON.stringify(options.alternatives) : null,
        options?.context ?? null,
        now,
        existing.id,
      );
      return { id: existing.id };
    }

    const stmt = this.db!.prepare(`
      INSERT INTO research_decisions (
        feature_id, title, decision, rationale, alternatives, context,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      featureId,
      title,
      decision,
      options?.rationale ?? null,
      options?.alternatives ? JSON.stringify(options.alternatives) : null,
      options?.context ?? null,
      now,
      now,
    );

    return { id: result.lastInsertRowid as number };
  }

  getResearchDecisionsByFeature(featureId: number): Array<{
    id: number;
    feature_id: number;
    title: string;
    decision: string;
    rationale: string | null;
    alternatives: string | null;
    context: string | null;
    created_at: number;
    updated_at: number;
  }> {
    const stmt = this.db!.prepare(
      "SELECT * FROM research_decisions WHERE feature_id = ? ORDER BY created_at",
    );
    return stmt.all(featureId) as Array<{
      id: number;
      feature_id: number;
      title: string;
      decision: string;
      rationale: string | null;
      alternatives: string | null;
      context: string | null;
      created_at: number;
      updated_at: number;
    }>;
  }

  deleteResearchDecisionsByFeature(featureId: number): void {
    this.db!.prepare("DELETE FROM research_decisions WHERE feature_id = ?").run(
      featureId,
    );
  }

  // ========================================
  // Plan Operations
  // ========================================

  upsertPlan(
    featureId: number,
    options?: {
      summary?: string;
      techStack?: Record<string, string>;
      phases?: Array<
        { name: string; goal: string; order: number; tasks: string[] }
      >;
      dependencies?: string[];
      risks?: Array<{ risk: string; mitigation: string }>;
    },
  ): { id: number } {
    const now = Date.now();
    const existing = this.getPlanByFeature(featureId);

    if (existing) {
      const stmt = this.db!.prepare(`
        UPDATE plans SET 
          summary = ?, tech_stack = ?, phases = ?, dependencies = ?, risks = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        options?.summary ?? existing.summary,
        options?.techStack
          ? JSON.stringify(options.techStack)
          : existing.tech_stack,
        options?.phases ? JSON.stringify(options.phases) : existing.phases,
        options?.dependencies
          ? JSON.stringify(options.dependencies)
          : existing.dependencies,
        options?.risks ? JSON.stringify(options.risks) : existing.risks,
        now,
        existing.id,
      );
      return { id: existing.id };
    }

    const stmt = this.db!.prepare(`
      INSERT INTO plans (
        feature_id, summary, tech_stack, phases, dependencies, risks,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      featureId,
      options?.summary ?? null,
      options?.techStack ? JSON.stringify(options.techStack) : null,
      options?.phases ? JSON.stringify(options.phases) : null,
      options?.dependencies ? JSON.stringify(options.dependencies) : null,
      options?.risks ? JSON.stringify(options.risks) : null,
      now,
      now,
    );

    return { id: result.lastInsertRowid as number };
  }

  getPlanByFeature(featureId: number): {
    id: number;
    feature_id: number;
    summary: string | null;
    tech_stack: string | null;
    phases: string | null;
    dependencies: string | null;
    risks: string | null;
    created_at: number;
    updated_at: number;
  } | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM plans WHERE feature_id = ?",
    );
    return stmt.get(featureId) as {
      id: number;
      feature_id: number;
      summary: string | null;
      tech_stack: string | null;
      phases: string | null;
      dependencies: string | null;
      risks: string | null;
      created_at: number;
      updated_at: number;
    } | null;
  }

  deletePlanByFeature(featureId: number): void {
    this.db!.prepare("DELETE FROM plans WHERE feature_id = ?").run(featureId);
  }

  // ========================================
  // Feature Description Operations
  // ========================================

  updateFeatureDescription(featureId: number, description: string): void {
    const stmt = this.db!.prepare(
      "UPDATE features SET description = ?, updated_at = ? WHERE id = ?",
    );
    stmt.run(description, Date.now(), featureId);
  }

  // ========================================
  // Stats Aggregation
  // ========================================

  getProjectStats(projectId: number): {
    totalFeatures: number;
    featuresByStatus: Record<string, number>;
    avgTaskCompletion: number;
    totalTasks: number;
    tasksByStatus: Record<string, number>;
  } {
    // Feature stats
    const featureStats = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as complete,
        AVG(task_completion_pct) as avg_completion
      FROM features WHERE project_id = ?
    `).get(projectId) as {
      total: number;
      draft: number;
      approved: number;
      in_progress: number;
      complete: number;
      avg_completion: number | null;
    };

    // Task stats
    const taskStats = this.db!.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'not_started' THEN 1 ELSE 0 END) as not_started,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks t
      JOIN features f ON t.feature_id = f.id
      WHERE f.project_id = ?
    `).get(projectId) as {
      total: number;
      not_started: number;
      in_progress: number;
      done: number;
    };

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
  createAnalysisResult(
    requestId: string,
    featureId: number,
    analysisType: "summary" | "consistency" | "gaps",
    content: string,
    duration: number,
    tokenCount?: number,
    filePath?: string,
  ): { id: number; requestId: string } {
    const stmt = this.db!.prepare(`
      INSERT INTO analysis_results (
        request_id, feature_id, analysis_type, content, token_count, duration, file_path, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      requestId,
      featureId,
      analysisType,
      content,
      tokenCount ?? null,
      duration,
      filePath ?? null,
      Date.now(),
    );
    return { id: result.lastInsertRowid as number, requestId };
  }

  /**
   * Get analysis result by request ID
   */
  getAnalysisResultByRequestId(requestId: string): {
    id: number;
    request_id: string;
    feature_id: number;
    analysis_type: string;
    content: string;
    token_count: number | null;
    duration: number;
    created_at: number;
  } | null {
    const stmt = this.db!.prepare(
      "SELECT * FROM analysis_results WHERE request_id = ?",
    );
    return stmt.get(requestId) as {
      id: number;
      request_id: string;
      feature_id: number;
      analysis_type: string;
      content: string;
      token_count: number | null;
      duration: number;
      created_at: number;
    } | null;
  }

  /**
   * Get analysis results by feature with optional type filter
   */
  getAnalysisResultsByFeature(
    featureId: number,
    analysisType?: "summary" | "consistency" | "gaps",
    limit: number = 10,
  ): Array<{
    id: number;
    request_id: string;
    feature_id: number;
    analysis_type: string;
    content: string;
    token_count: number | null;
    duration: number;
    created_at: number;
  }> {
    if (analysisType) {
      const stmt = this.db!.prepare(`
        SELECT * FROM analysis_results 
        WHERE feature_id = ? AND analysis_type = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(featureId, analysisType, limit) as Array<{
        id: number;
        request_id: string;
        feature_id: number;
        analysis_type: string;
        content: string;
        token_count: number | null;
        duration: number;
        created_at: number;
      }>;
    }
    const stmt = this.db!.prepare(`
      SELECT * FROM analysis_results 
      WHERE feature_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(featureId, limit) as Array<{
      id: number;
      request_id: string;
      feature_id: number;
      analysis_type: string;
      content: string;
      token_count: number | null;
      duration: number;
      created_at: number;
      file_path: string | null;
    }>;
  }

  /**
   * Get the latest analysis result for a specific feature, type, and optional file
   */
  getLatestAnalysisResult(
    featureId: number,
    analysisType: "summary" | "consistency" | "gaps",
    filePath?: string,
  ): {
    id: number;
    request_id: string;
    feature_id: number;
    analysis_type: string;
    content: string;
    token_count: number | null;
    duration: number;
    created_at: number;
    file_path: string | null;
  } | null {
    if (filePath) {
      const stmt = this.db!.prepare(`
        SELECT * FROM analysis_results 
        WHERE feature_id = ? AND analysis_type = ? AND file_path = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      return stmt.get(featureId, analysisType, filePath) as any;
    }

    const stmt = this.db!.prepare(`
      SELECT * FROM analysis_results 
      WHERE feature_id = ? AND analysis_type = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(featureId, analysisType) as any;
  }

  /**
   * Delete analysis results for a feature
   */
  deleteAnalysisResultsByFeature(featureId: number): void {
    this.db!.prepare("DELETE FROM analysis_results WHERE feature_id = ?").run(
      featureId,
    );
  }

  // ========================================
  // Enhanced Entity Operations (with source tracking)
  // ========================================

  /**
   * Update entity with source file tracking
   */
  updateEntitySource(
    entityId: number,
    sourceFile: string,
    lineNumber: number | null,
  ): void {
    const stmt = this.db!.prepare(`
      UPDATE entities 
      SET source_file = ?, line_number = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(sourceFile, lineNumber, Date.now(), entityId);
  }

  /**
   * Get entity by ID with source tracking
   */
  getEntityById(entityId: number):
    | DbEntity & {
      source_file?: string;
      line_number?: number | null;
    }
    | null {
    const stmt = this.db!.prepare("SELECT * FROM entities WHERE id = ?");
    return stmt.get(entityId) as
      | DbEntity & {
        source_file?: string;
        line_number?: number | null;
      }
      | null;
  }

  // ========================================
  // Migration Support
  // ========================================

  /**
   * Run a migration if not already applied
   */
  runMigration(migrationFn: (db: Database.Database) => void): void {
    if (this.db) {
      migrationFn(this.db);
    }
  }

  /**
   * Check if analysis_results table exists
   */
  hasAnalysisResultsTable(): boolean {
    try {
      const tables = this.db!.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='analysis_results'
      `).all() as Array<{ name: string }>;
      return tables.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;

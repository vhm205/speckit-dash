-- Speckit Dashboard Database Schema
-- SQLite with WAL mode for performance

-- Projects table: stores project paths and metadata
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT UNIQUE NOT NULL,
  last_opened_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Features table: stores parsed feature specs
CREATE TABLE IF NOT EXISTS features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  feature_number TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'in_progress', 'complete')) DEFAULT 'draft',
  spec_path TEXT NOT NULL,
  priority TEXT,
  created_date TEXT,
  task_completion_pct REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, feature_number)
);

-- Tasks table: stores parsed tasks from tasks.md
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('not_started', 'in_progress', 'done')) DEFAULT 'not_started',
  phase TEXT,
  phase_order INTEGER,
  is_parallel INTEGER DEFAULT 0,
  dependencies TEXT, -- JSON array
  story_label TEXT,
  file_path TEXT,
  line_number INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, task_id)
);

-- Entities table: stores parsed entities from data-model.md
CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  description TEXT,
  attributes TEXT, -- JSON array
  relationships TEXT, -- JSON array
  validation_rules TEXT, -- JSON array
  state_transitions TEXT, -- JSON object
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, entity_name)
);

-- Requirements table: stores parsed requirements from spec.md
CREATE TABLE IF NOT EXISTS requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  requirement_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('functional', 'non_functional', 'constraint')) DEFAULT 'functional',
  description TEXT NOT NULL,
  priority TEXT,
  linked_tasks TEXT, -- JSON array
  acceptance_criteria TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, requirement_id)
);

-- Plans table: stores parsed plan.md data
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER UNIQUE NOT NULL,
  summary TEXT,
  tech_stack TEXT, -- JSON object
  phases TEXT, -- JSON array
  dependencies TEXT, -- JSON array
  risks TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Research decisions table: stores parsed research.md data
CREATE TABLE IF NOT EXISTS research_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT,
  alternatives TEXT, -- JSON array
  context TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_tasks_feature ON tasks(feature_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_entities_feature ON entities(feature_id);
CREATE INDEX IF NOT EXISTS idx_requirements_feature ON requirements(feature_id);
CREATE INDEX IF NOT EXISTS idx_plans_feature ON plans(feature_id);
CREATE INDEX IF NOT EXISTS idx_research_feature ON research_decisions(feature_id);

-- Analysis results table: stores AI-generated analysis (summaries, consistency checks, etc.)
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT UNIQUE NOT NULL,
  feature_id INTEGER NOT NULL,
  file_path TEXT, -- Nullable for checks involving multiple files
  analysis_type TEXT NOT NULL CHECK(analysis_type IN ('summary', 'consistency', 'gaps')),
  content TEXT NOT NULL, -- JSON formatted result
  token_count INTEGER,
  duration INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Additional indexes for analysis results
CREATE INDEX IF NOT EXISTS idx_analysis_feature ON analysis_results(feature_id);
CREATE INDEX IF NOT EXISTS idx_analysis_request ON analysis_results(request_id);


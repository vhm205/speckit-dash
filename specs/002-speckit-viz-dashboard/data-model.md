# Data Model: Speckit Visualization Dashboard

**Feature**: Speckit Documentation Visualization Dashboard\
**Date**: 2025-12-28\
**Phase**: 1 - Data Model Design

## Persistence Layer: SQLite

All entities are persisted in an embedded SQLite database located at
`~/.speckit-dash/data.db`.

## Core Entities

### Project

Represents a Spec-kit project that the user has configured in the dashboard.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique project identifier
- `name` (TEXT, NOT NULL): Human-readable project name (derived from root path
  basename)
- `root_path` (TEXT, UNIQUE, NOT NULL): Absolute path to project root containing
  `.specify/` folder
- `last_opened_at` (INTEGER, NOT NULL): Unix timestamp when project was last
  opened/switched to
- `created_at` (INTEGER, NOT NULL): Unix timestamp when project was first added

**Relationships**:

- One Project has many Features (1:N)

**Lifecycle**:

- Created when user configures new project path via modal
- Updated (`last_opened_at`) when user switches to this project
- Deleted when user removes project from saved list

**Validation Rules**:

- `root_path` must contain `.specify/` directory
- `root_path` must contain `specs/` directory
- `name` derived automatically from path basename unless manually overridden

---

### Feature

Represents a single feature specification (e.g., `001-speckit-viz-dashboard`).

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique feature identifier
- `project_id` (INTEGER, FOREIGN KEY → projects.id, NOT NULL): Parent project
- `feature_number` (TEXT, NOT NULL): Feature number (e.g., "001", "002")
- `feature_name` (TEXT, NOT NULL): Short name (e.g., "speckit-viz-dashboard")
- `title` (TEXT): Full feature title from spec.md (e.g., "Speckit Documentation
  Visualization Dashboard")
- `status` (TEXT, NOT NULL): Current status - one of: `'draft'`, `'approved'`,
  `'in_progress'`, `'complete'`
- `spec_path` (TEXT, NOT NULL): Relative path to spec.md from project root
- `priority` (TEXT): Priority if specified (e.g., "P1", "P2")
- `created_date` (TEXT): Creation date from spec.md frontmatter (YYYY-MM-DD)
- `task_completion_pct` (REAL): Percentage of tasks marked done (0.0 to 100.0)
- `created_at` (INTEGER, NOT NULL): When feature was first scanned
- `updated_at` (INTEGER, NOT NULL): Last time feature files were parsed

**Relationships**:

- One Feature belongs to one Project (N:1)
- One Feature has many Tasks (1:N)
- One Feature has many Entities (1:N)
- One Feature has many Requirements (1:N)
- One Feature has zero or one Plan (1:0..1)

**Lifecycle**:

- Created when file watcher detects new `specs/###-name/spec.md`
- Updated when spec.md or tasks.md changes
- Deleted when feature directory is removed

**Status Transitions**:

```
draft → approved → in_progress → complete
  ↓        ↓            ↓
 (any status can return to draft if spec is re-edited)
```

**Derived Fields**:

- `task_completion_pct`: COUNT(tasks WHERE status='done') / COUNT(tasks) * 100

---

### Task

Represents an individual task from tasks.md.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique task identifier
- `feature_id` (INTEGER, FOREIGN KEY → features.id, NOT NULL): Parent feature
- `task_id` (TEXT, NOT NULL): Task identifier from tasks.md (e.g., "T001",
  "T015")
- `description` (TEXT, NOT NULL): Task description text
- `status` (TEXT, NOT NULL): One of: `'not_started'` (checkbox `[ ]`),
  `'in_progress'` (`[/]`), `'done'` (`[x]`)
- `phase` (TEXT): Phase name (e.g., "Setup", "User Story 1", "Polish")
- `phase_order` (INTEGER): Numeric order of phase for sorting
- `is_parallel` (BOOLEAN): Whether task is marked `[P]` for parallel execution
- `dependencies` (TEXT): JSON array of task_ids this task depends on (e.g.,
  `["T012", "T013"]`)
- `story_label` (TEXT): User story label if present (e.g., "US1", "US2")
- `file_path` (TEXT): File path mentioned in task description (if any)
- `line_number` (INTEGER): Line number in tasks.md where task appears
- `created_at` (INTEGER, NOT NULL): When task was first parsed
- `updated_at` (INTEGER, NOT NULL): When task status/content last changed

**Relationships**:

- One Task belongs to one Feature (N:1)
- One Task may depend on many Tasks (N:N self-reference)

**Lifecycle**:

- Created/updated when tasks.md is parsed
- Deleted when removed from tasks.md or feature deleted

**Status Detection**:

- Parse markdown checkbox: `- [ ]` → `'not_started'`, `- [/]` → `'in_progress'`,
  `- [x]` → `'done'`

---

### Entity

Represents a data entity/model from data-model.md.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique entity identifier
- `feature_id` (INTEGER, FOREIGN KEY → features.id, NOT NULL): Parent feature
- `entity_name` (TEXT, NOT NULL): Entity name (e.g., "Project", "Task",
  "Feature")
- `description` (TEXT): Entity description/purpose
- `attributes` (TEXT): JSON array of attribute objects:
  `[{"name": "id", "type": "INTEGER", "constraints": "PRIMARY KEY"}]`
- `relationships` (TEXT): JSON array of relationship objects:
  `[{"target": "Project", "type": "N:1", "description": "belongs to"}]`
- `validation_rules` (TEXT): JSON array of validation rules
- `state_transitions` (TEXT): State machine definition if applicable (JSON)
- `created_at` (INTEGER, NOT NULL): When entity was first parsed
- `updated_at` (INTEGER, NOT NULL): When entity was last modified

**Relationships**:

- One Entity belongs to one Feature (N:1)

**Lifecycle**:

- Created/updated when data-model.md is parsed
- Deleted when removed from data-model.md or feature deleted

---

### Requirement

Represents a functional requirement from spec.md.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique requirement identifier
- `feature_id` (INTEGER, FOREIGN KEY → features.id, NOT NULL): Parent feature
- `requirement_id` (TEXT, NOT NULL): Requirement ID (e.g., "FR-001", "NFR-005")
- `type` (TEXT, NOT NULL): One of: `'functional'`, `'non_functional'`,
  `'constraint'`
- `description` (TEXT, NOT NULL): Requirement text
- `priority` (TEXT): Priority level (e.g., "MUST", "SHOULD", "MAY")
- `linked_tasks` (TEXT): JSON array of task_ids that implement this requirement
- `acceptance_criteria` (TEXT): JSON array of acceptance scenario texts
- `created_at` (INTEGER, NOT NULL): When requirement was first parsed
- `updated_at` (INTEGER, NOT NULL): When requirement was last modified

**Relationships**:

- One Requirement belongs to one Feature (N:1)
- One Requirement may link to many Tasks (N:N)

**Lifecycle**:

- Created/updated when spec.md is parsed
- Deleted when removed from spec.md or feature deleted

---

### Plan

Represents the implementation plan from plan.md.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique plan identifier
- `feature_id` (INTEGER, FOREIGN KEY → features.id, UNIQUE, NOT NULL): Parent
  feature (one-to-one)
- `summary` (TEXT): Plan summary/overview
- `tech_stack` (TEXT): JSON object with technology choices
- `phases` (TEXT): JSON array of phase objects with goals and timelines
- `dependencies` (TEXT): JSON array of external dependencies
- `risks` (TEXT): JSON array of risk mitigation items
- `created_at` (INTEGER, NOT NULL): When plan was first parsed
- `updated_at` (INTEGER, NOT NULL): When plan was last modified

**Relationships**:

- One Plan belongs to one Feature (1:1)

**Lifecycle**:

- Created when plan.md is detected
- Updated when plan.md changes
- Deleted when plan.md removed or feature deleted

---

### Research Decision

Represents a documented decision from research.md.

**Attributes**:

- `id` (INTEGER, PRIMARY KEY, AUTOINCREMENT): Unique decision identifier
- `feature_id` (INTEGER, FOREIGN KEY → features.id, NOT NULL): Parent feature
- `title` (TEXT, NOT NULL): Decision title/topic
- `decision` (TEXT, NOT NULL): What was chosen
- `rationale` (TEXT): Why it was chosen
- `alternatives` (TEXT): JSON array of alternatives considered
- `context` (TEXT): Additional context or constraints
- `created_at` (INTEGER, NOT NULL): When decision was first parsed
- `updated_at` (INTEGER, NOT NULL): When decision was last modified

**Relationships**:

- One Research Decision belongs to one Feature (N:1)

**Lifecycle**:

- Created/updated when research.md is parsed
- Deleted when removed from research.md or feature deleted

---

## In-Memory State (Not Persisted)

### File Watcher State

**Attributes**:

- `active_project_path` (string): Currently selected project root path
- `watcher_instance` (chokidar.FSWatcher): Active file watcher instance
- `pending_updates` (Map<string, Timer>): Debounced update timers keyed by file
  path
- `is_watching` (boolean): Whether file watching is active

**Lifecycle**:

- Created when user selects a project
- Destroyed when user closes app or switches projects

---

### UI State (React Context)

**Attributes**:

- `current_view` (string): Active view - one of: `'stats'`, `'features'`,
  `'kanban'`, `'gantt'`, `'architecture'`
- `selected_feature_id` (number | null): Currently selected feature for
  drill-down views
- `theme` (string): UI theme - `'light'` or `'dark'`
- `is_loading` (boolean): Global loading state
- `error` (Error | null): Current error state

**Lifecycle**:

- Managed by React Context API
- Persisted to localStorage for session recovery

---

## Database Schema (SQLite)

```sql
-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT UNIQUE NOT NULL,
  last_opened_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Features
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  feature_number TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  title TEXT,
  status TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'in_progress', 'complete')),
  spec_path TEXT NOT NULL,
  priority TEXT,
  created_date TEXT,
  task_completion_pct REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, feature_number)
);

-- Tasks
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('not_started', 'in_progress', 'done')),
  phase TEXT,
  phase_order INTEGER,
  is_parallel BOOLEAN DEFAULT 0,
  dependencies TEXT, -- JSON array
  story_label TEXT,
  file_path TEXT,
  line_number INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, task_id)
);

-- Entities
CREATE TABLE entities (
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

-- Requirements
CREATE TABLE requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  requirement_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('functional', 'non_functional', 'constraint')),
  description TEXT NOT NULL,
  priority TEXT,
  linked_tasks TEXT, -- JSON array
  acceptance_criteria TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  UNIQUE(feature_id, requirement_id)
);

-- Plans
CREATE TABLE plans (
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

-- Research Decisions
CREATE TABLE research_decisions (
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

-- Indexes for performance
CREATE INDEX idx_features_project ON features(project_id);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_tasks_feature ON tasks(feature_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_entities_feature ON entities(feature_id);
CREATE INDEX idx_requirements_feature ON requirements(feature_id);
CREATE INDEX idx_plans_feature ON plans(feature_id);
CREATE INDEX idx_research_feature ON research_decisions(feature_id);
```

## Data Flow

### Project Configuration

```
User selects path → Validate .specify/ exists → Create/Update Project record → 
Scan specs/ directory → Create Feature records → Start file watcher
```

### File Change Detection

```
File modified → Chokidar event → Debounce 500ms → 
Parse file → Update relevant entities in SQLite → 
Emit event to React → Re-query and re-render affected views
```

### Kanban View Data Loading

```
User clicks feature → Query tasks WHERE feature_id = ? → 
Group by phase → Group by status within phase → 
Render in Kanban columns
```

### Stats Overview Aggregation

```
Query features for project → Calculate: 
  - Total features count
  - Status breakdown (draft/approved/in_progress/complete)
  - Average task_completion_pct
  - Parse recent file timestamps for trend data
→ Render charts
```

## Next Steps

Phase 1 continued: Generate contracts/ (if applicable) and quickstart.md.

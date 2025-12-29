# API Contracts: Speckit Visualization Dashboard

**Feature**: Speckit Documentation Visualization Dashboard\
**Date**: 2025-12-28

## Architecture Note

This is an Electron desktop application with:

- **Main Process** (Node.js): File system, database, file watching
- **Renderer Process** (React): UI rendering

Communication happens via **Electron IPC (Inter-Process Communication)**.

## IPC Channels (Main ↔ Renderer)

### Project Management

#### `project:configure`

**Direction**: Renderer → Main\
**Purpose**: Add or update a project path

**Request**:

```typescript
interface ProjectConfigureRequest {
  rootPath: string; // Absolute path to project root
}
```

**Response**:

```typescript
interface ProjectConfigureResponse {
  success: boolean;
  project?: {
    id: number;
    name: string;
    rootPath: string;
  };
  error?: string; // If validation fails
}
```

**Validation**:

- `rootPath` must contain `.specify/` directory
- `rootPath` must contain `specs/` directory

---

#### `project:list`

**Direction**: Renderer → Main\
**Purpose**: Get all configured projects

**Request**: None

**Response**:

```typescript
interface ProjectListResponse {
  projects: Array<{
    id: number;
    name: string;
    rootPath: string;
    lastOpenedAt: number; // Unix timestamp
  }>;
}
```

---

#### `project:select`

**Direction**: Renderer → Main\
**Purpose**: Switch active project and start file watching

**Request**:

```typescript
interface ProjectSelectRequest {
  projectId: number;
}
```

**Response**:

```typescript
interface ProjectSelectResponse {
  success: boolean;
  error?: string;
}
```

**Side Effects**:

- Updates `last_opened_at` timestamp
- Starts file watcher for selected project
- Triggers initial scan of specs/ directory

---

#### `project:remove`

**Direction**: Renderer → Main\
**Purpose**: Remove a project from saved list

**Request**:

```typescript
interface ProjectRemoveRequest {
  projectId: number;
}
```

**Response**:

```typescript
interface ProjectRemoveResponse {
  success: boolean;
}
```

**Side Effects**:

- Deletes project record and all associated features/tasks from database
- Stops file watcher if this was active project

---

### Feature Queries

#### `features:list`

**Direction**: Renderer → Main\
**Purpose**: Get all features for active project

**Request**:

```typescript
interface FeaturesListRequest {
  projectId: number;
  filters?: {
    status?: "draft" | "approved" | "in_progress" | "complete";
    priority?: string;
  };
}
```

**Response**:

```typescript
interface FeaturesListResponse {
  features: Array<{
    id: number;
    featureNumber: string;
    featureName: string;
    title: string | null;
    status: "draft" | "approved" | "in_progress" | "complete";
    taskCompletionPct: number;
    createdDate: string | null;
    priority: string | null;
  }>;
}
```

---

#### `features:get`

**Direction**: Renderer → Main\
**Purpose**: Get detailed information for a single feature

**Request**:

```typescript
interface FeatureGetRequest {
  featureId: number;
}
```

**Response**:

```typescript
interface FeatureGetResponse {
  feature: {
    id: number;
    featureNumber: string;
    featureName: string;
    title: string | null;
    status: string;
    specPath: string;
    taskCompletionPct: number;
    createdDate: string | null;
    updatedAt: number;
  };
  tasks: Array<Task>; // See Task type below
  entities: Array<Entity>; // See Entity type below
  requirements: Array<Requirement>; // See Requirement type below
  plan: Plan | null; // See Plan type below
}
```

---

### Task Queries

#### `tasks:list`

**Direction**: Renderer → Main\
**Purpose**: Get tasks for a feature (used by Kanban view)

**Request**:

```typescript
interface TasksListRequest {
  featureId: number;
  groupBy?: "phase" | "status" | "story";
}
```

**Response**:

```typescript
interface TasksListResponse {
  tasks: Array<{
    id: number;
    taskId: string;
    description: string;
    status: "not_started" | "in_progress" | "done";
    phase: string | null;
    phaseOrder: number | null;
    isParallel: boolean;
    dependencies: string[]; // JSON parsed
    storyLabel: string | null;
    filePath: string | null;
  }>;
}
```

---

### Entity Queries (for Architecture View)

#### `entities:list`

**Direction**: Renderer → Main\
**Purpose**: Get entities for a feature to render diagrams

**Request**:

```typescript
interface EntitiesListRequest {
  featureId: number;
}
```

**Response**:

```typescript
interface EntitiesListResponse {
  entities: Array<{
    id: number;
    entityName: string;
    description: string | null;
    attributes: Array<{
      name: string;
      type: string;
      constraints?: string;
    }>;
    relationships: Array<{
      target: string;
      type: string; // '1:1', '1:N', 'N:1', 'N:N'
      description?: string;
    }>;
  }>;
}
```

---

### Stats Aggregation

#### `stats:overview`

**Direction**: Renderer → Main\
**Purpose**: Get aggregate stats for project dashboard

**Request**:

```typescript
interface StatsOverviewRequest {
  projectId: number;
}
```

**Response**:

```typescript
interface StatsOverviewResponse {
  totalFeatures: number;
  featuresByStatus: {
    draft: number;
    approved: number;
    in_progress: number;
    complete: number;
  };
  avgTaskCompletion: number; // 0-100
  totalTasks: number;
  tasksByStatus: {
    not_started: number;
    in_progress: number;
    done: number;
  };
}
```

---

### File Watching Events

#### `file-watcher:change`

**Direction**: Main → Renderer (event)\
**Purpose**: Notify renderer of file changes

**Payload**:

```typescript
interface FileChangeEvent {
  eventType: "add" | "change" | "unlink";
  filePath: string; // Relative to project root
  affectedFeatureId?: number;
}
```

**Renderer Action**:

- Re-query affected feature data
- Update UI to reflect changes

---

## TypeScript Type Definitions

```typescript
// Shared types between main and renderer

interface Task {
  id: number;
  taskId: string;
  description: string;
  status: "not_started" | "in_progress" | "done";
  phase: string | null;
  phaseOrder: number | null;
  isParallel: boolean;
  dependencies: string[];
  storyLabel: string | null;
  filePath: string | null;
  lineNumber: number | null;
}

interface Entity {
  id: number;
  entityName: string;
  description: string | null;
  attributes: Array<{
    name: string;
    type: string;
    constraints?: string;
  }>;
  relationships: Array<{
    target: string;
    type: "1:1" | "1:N" | "N:1" | "N:N";
    description?: string;
  }>;
}

interface Requirement {
  id: number;
  requirementId: string;
  type: "functional" | "non_functional" | "constraint";
  description: string;
  priority: string | null;
  linkedTasks: string[];
  acceptanceCriteria: string[];
}

interface Plan {
  id: number;
  summary: string | null;
  techStack: Record<string, unknown>;
  phases: Array<{
    name: string;
    goal: string;
    tasks: string[];
  }>;
  dependencies: string[];
  risks: Array<{
    risk: string;
    mitigation: string;
  }>;
}
```

## Error Handling

All IPC handlers should return errors in this format:

```typescript
interface ErrorResponse {
  success: false;
  error: string; // Human-readable error message
  code?: string; // Optional error code (e.g., 'INVALID_PATH', 'DB_ERROR')
}
```

Common error codes:

- `INVALID_PATH`: Project path validation failed
- `NOT_FOUND`: Requested resource doesn't exist
- `DB_ERROR`: SQLite database operation failed
- `PARSE_ERROR`: Markdown parsing failed
- `FILE_SYSTEM_ERROR`: File read/write failed

## Security Considerations

Since this is a local desktop app:

- **No authentication required** (OS file permissions handle access control)
- **No network requests** (except for package updates)
- **Local data only** (SQLite database in user home directory)
- **File system access limited** to user-selected project directories

/**
 * Speckit Dashboard - Core Entity Types
 * TypeScript definitions for all database entities and IPC interfaces
 */

// ============================================
// Database Entity Types
// ============================================

export interface Project {
  id: number;
  name: string;
  rootPath: string;
  lastOpenedAt: number;
  createdAt: number;
}

export type FeatureStatus = "draft" | "approved" | "in_progress" | "complete";

export interface Feature {
  id: number;
  projectId: number;
  featureNumber: string;
  featureName: string;
  title: string | null;
  status: FeatureStatus;
  specPath: string;
  priority: string | null;
  createdDate: string | null;
  taskCompletionPct: number;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = "not_started" | "in_progress" | "done";

export interface Task {
  id: number;
  featureId: number;
  taskId: string;
  description: string;
  status: TaskStatus;
  phase: string | null;
  phaseOrder: number | null;
  isParallel: boolean;
  dependencies: string[];
  storyLabel: string | null;
  filePath: string | null;
  lineNumber: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface EntityAttribute {
  name: string;
  type: string;
  constraints?: string;
}

export interface EntityRelationship {
  target: string;
  type: "1:1" | "1:N" | "N:1" | "N:N";
  description?: string;
}

export interface Entity {
  id: number;
  featureId: number;
  entityName: string;
  description: string | null;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  validationRules: string[] | null;
  stateTransitions: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

export type RequirementType = "functional" | "non_functional" | "constraint";

export interface Requirement {
  id: number;
  featureId: number;
  requirementId: string;
  type: RequirementType;
  description: string;
  priority: string | null;
  linkedTasks: string[];
  acceptanceCriteria: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlanPhase {
  name: string;
  goal: string;
  tasks: string[];
}

export interface PlanRisk {
  risk: string;
  mitigation: string;
}

export interface Plan {
  id: number;
  featureId: number;
  summary: string | null;
  techStack: Record<string, unknown>;
  phases: PlanPhase[];
  dependencies: string[];
  risks: PlanRisk[];
  createdAt: number;
  updatedAt: number;
}

export interface ResearchDecision {
  id: number;
  featureId: number;
  title: string;
  decision: string;
  rationale: string | null;
  alternatives: string[];
  context: string | null;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// Stats Types
// ============================================

export interface ProjectStats {
  totalFeatures: number;
  featuresByStatus: {
    draft: number;
    approved: number;
    in_progress: number;
    complete: number;
  };
  avgTaskCompletion: number;
  totalTasks: number;
  tasksByStatus: {
    not_started: number;
    in_progress: number;
    done: number;
  };
}

// ============================================
// UI State Types
// ============================================

export type ViewType =
  | "stats"
  | "features"
  | "kanban"
  | "gantt"
  | "architecture";
export type ThemeMode = "light" | "dark" | "system";

export interface AppState {
  currentView: ViewType;
  selectedFeatureId: number | null;
  selectedProjectId: number | null;
  theme: ThemeMode;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// File Watcher Types
// ============================================

export type FileEventType = "add" | "change" | "unlink";

export interface FileChangeEvent {
  eventType: FileEventType;
  filePath: string;
  affectedFeatureId?: number;
}

// ============================================
// AI SDK Types (re-export from ai.ts)
// ============================================
export * from "./ai";

// ============================================
// Schema Visualization Types (re-export from schema.ts)
// ============================================
export * from "./schema";

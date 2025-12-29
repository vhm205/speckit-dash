/**
 * Speckit Dashboard - IPC Channel Types
 * TypeScript definitions for Electron IPC communication between main and renderer
 */

import type {
  Entity,
  Feature,
  FileChangeEvent,
  Plan,
  Project,
  ProjectStats,
  Requirement,
  ResearchDecision,
  Task,
} from "./index";

// ============================================
// Base Response Types
// ============================================

export interface SuccessResponse<T = void> {
  success: true;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?:
    | "INVALID_PATH"
    | "NOT_FOUND"
    | "DB_ERROR"
    | "PARSE_ERROR"
    | "FILE_SYSTEM_ERROR";
}

export type IPCResponse<T = void> = SuccessResponse<T> | ErrorResponse;

// ============================================
// Project IPC Types
// ============================================

export interface ProjectConfigureRequest {
  rootPath: string;
}

export interface ProjectConfigureResponse {
  project: Project;
}

export interface ProjectListResponse {
  projects: Project[];
}

export interface ProjectSelectRequest {
  projectId: number;
}

export interface ProjectRemoveRequest {
  projectId: number;
}

// ============================================
// Feature IPC Types
// ============================================

export interface FeaturesListRequest {
  projectId: number;
  filters?: {
    status?: string;
    priority?: string;
  };
}

export interface FeaturesListResponse {
  features: Feature[];
}

export interface FeatureGetRequest {
  featureId: number;
}

export interface FeatureGetResponse {
  feature: Feature;
  tasks: Task[];
  entities: Entity[];
  requirements: Requirement[];
  plan: Plan | null;
  researchDecisions: ResearchDecision[];
}

// ============================================
// Task IPC Types
// ============================================

export interface TasksListRequest {
  featureId: number;
  groupBy?: "phase" | "status" | "story";
}

export interface TasksListResponse {
  tasks: Task[];
}

// ============================================
// Entity IPC Types
// ============================================

export interface EntitiesListRequest {
  featureId: number;
}

export interface EntitiesListResponse {
  entities: Entity[];
}

// ============================================
// Stats IPC Types
// ============================================

export interface StatsOverviewRequest {
  projectId: number;
}

export interface StatsOverviewResponse {
  stats: ProjectStats;
}

// ============================================
// IPC Channel Names
// ============================================

export const IPC_CHANNELS = {
  // Project management
  PROJECT_CONFIGURE: "project:configure",
  PROJECT_LIST: "project:list",
  PROJECT_SELECT: "project:select",
  PROJECT_REMOVE: "project:remove",

  // Feature queries
  FEATURES_LIST: "features:list",
  FEATURES_GET: "features:get",

  // Task queries
  TASKS_LIST: "tasks:list",

  // Entity queries
  ENTITIES_LIST: "entities:list",

  // Stats aggregation
  STATS_OVERVIEW: "stats:overview",

  // File watcher events
  FILE_WATCHER_CHANGE: "file-watcher:change",
} as const;

export type IPCChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

// ============================================
// Preload API Types
// ============================================

export interface ElectronAPI {
  // Project methods
  configureProject: (
    rootPath: string,
  ) => Promise<IPCResponse<ProjectConfigureResponse>>;
  listProjects: () => Promise<IPCResponse<ProjectListResponse>>;
  selectProject: (projectId: number) => Promise<IPCResponse<void>>;
  removeProject: (projectId: number) => Promise<IPCResponse<void>>;

  // Feature methods
  listFeatures: (
    projectId: number,
    filters?: FeaturesListRequest["filters"],
  ) => Promise<IPCResponse<FeaturesListResponse>>;
  getFeature: (featureId: number) => Promise<IPCResponse<FeatureGetResponse>>;

  // Task methods
  listTasks: (
    featureId: number,
    groupBy?: TasksListRequest["groupBy"],
  ) => Promise<IPCResponse<TasksListResponse>>;

  // Entity methods
  listEntities: (
    featureId: number,
  ) => Promise<IPCResponse<EntitiesListResponse>>;

  // Stats methods
  getStatsOverview: (
    projectId: number,
  ) => Promise<IPCResponse<StatsOverviewResponse>>;

  // File watcher listener
  onFileChange: (callback: (event: FileChangeEvent) => void) => () => void;
}

// Augment the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    HSStaticMethods: {
      autoInit(): void;
    };
  }
}

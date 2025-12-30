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
  syncProject: (
    projectId: number,
  ) => Promise<IPCResponse<{ synced: number; errors: string[] }>>;

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

  // AI Provider methods
  configureAIProvider: (
    provider: "openai" | "ollama",
    config: Record<string, unknown>,
  ) => Promise<IPCResponse<{ activeProvider: string }>>;
  getAIProviderConfig: () => Promise<
    IPCResponse<{
      activeProvider: "openai" | "ollama" | null;
      openai?: { model: string; baseURL: string; hasApiKey: boolean };
      ollama?: { baseURL: string; model: string; isRunning: boolean };
    }>
  >;
  switchAIProvider: (
    provider: "openai" | "ollama",
  ) => Promise<IPCResponse<{ activeProvider: string }>>;
  testAIConnection: (
    provider: "openai" | "ollama",
  ) => Promise<
    IPCResponse<{
      available: boolean;
      latency: number;
      models?: string[];
      error?: string;
    }>
  >;

  // AI Analysis methods
  generateSummary: (
    featureId: number,
    filePath: string,
    force?: boolean,
  ) => Promise<
    IPCResponse<{
      requestId: string;
      summary: string;
      keyPoints: string[];
      wordCount: number;
      duration: number;
      tokenCount?: number;
    }>
  >;
  checkConsistency: (
    featureId: number,
    files: string[],
  ) => Promise<
    IPCResponse<{
      requestId: string;
      discrepancies: Array<{
        type: string;
        file1: string;
        file2: string;
        section: string;
        description: string;
        severity: string;
      }>;
      overallConsistency: number;
      filesAnalyzed: string[];
      duration: number;
      tokenCount?: number;
    }>
  >;
  findGaps: (
    featureId: number,
    filePath: string,
  ) => Promise<
    IPCResponse<{
      requestId: string;
      gaps: Array<{
        section: string;
        issue: string;
        suggestion: string;
        severity: string;
      }>;
      completeness: number;
      sectionsAnalyzed: string[];
      duration: number;
      tokenCount?: number;
    }>
  >;
  getAnalysisHistory: (
    featureId: number,
    analysisType?: string,
    limit?: number,
  ) => Promise<
    IPCResponse<{
      analyses: Array<{
        id: number;
        requestId: string;
        analysisType: string;
        createdAt: number;
        duration: number;
        tokenCount: number | null;
        preview: string;
      }>;
    }>
  >;
  getAnalysisResult: (
    requestId: string,
  ) => Promise<IPCResponse<unknown>>;

  // Schema methods
  generateSchema: (
    featureId: number,
  ) => Promise<
    IPCResponse<{
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: {
          entityName: string;
          description: string;
          attributeCount: number;
          relationshipCount: number;
        };
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        type: string;
        label: string;
      }>;
      metadata: {
        entityCount: number;
        relationshipCount: number;
        generatedAt: number;
      };
    }>
  >;
  getEntityDetails: (
    entityId: number,
  ) => Promise<
    IPCResponse<{
      entity: {
        id: number;
        entityName: string;
        description: string | null;
        attributes: Array<{ name: string; type: string; description?: string }>;
        relationships: Array<
          { target: string; type: string; description?: string }
        >;
        sourceFile: string | null;
        lineNumber: number | null;
      };
    }>
  >;

  // File content methods
  readSpecFile: (
    featureId: number,
    fileType: "spec" | "plan" | "tasks" | "data-model" | "requirements",
  ) => Promise<
    IPCResponse<{
      content: string;
      sections: Array<{
        heading: string;
        level: number;
        lineStart: number;
        lineEnd: number;
      }>;
      metadata: {
        title: string;
        status: string;
        created: string | null;
      };
    }>
  >;
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

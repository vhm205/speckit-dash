/**
 * AI SDK TypeScript Type Definitions
 * Types for AI provider integration and analysis operations
 */

// ============================================================================
// AI Provider Configuration Types
// ============================================================================

/**
 * Supported AI provider types
 */
export type AIProviderType = "openai" | "ollama";

/**
 * Analysis types supported by the system
 */
export type AnalysisType = "summary" | "consistency" | "gaps";

/**
 * Analysis request status
 */
export type RequestStatus = "pending" | "processing" | "completed" | "failed";

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

/**
 * Ollama provider configuration
 */
export interface OllamaConfig {
  baseURL: string;
  model: string;
  timeout?: number;
}

/**
 * Complete AI provider configuration stored in electron-store
 */
export interface AIProviderConfig {
  activeProvider: AIProviderType | null;
  openai: OpenAIConfig | null;
  ollama: OllamaConfig | null;
}

/**
 * Safe OpenAI config for renderer process (no API key exposed)
 */
export interface SafeOpenAIConfig {
  model: string;
  baseURL: string;
  hasApiKey: boolean;
}

/**
 * Safe Ollama config for renderer process
 */
export interface SafeOllamaConfig {
  baseURL: string;
  model: string;
  isRunning: boolean;
}

/**
 * Provider configuration response for renderer
 */
export interface AIProviderConfigResponse {
  activeProvider: AIProviderType | null;
  openai?: SafeOpenAIConfig;
  ollama?: SafeOllamaConfig;
}

// ============================================================================
// Analysis Request/Response Types
// ============================================================================

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  id: string;
  type: AnalysisType;
  featureId: number;
  inputFiles: string[];
  provider: AIProviderType;
  model: string;
  status: RequestStatus;
  createdAt: number;
  completedAt: number | null;
}

/**
 * Analysis result stored in database
 */
export interface AnalysisResult {
  id: number;
  requestId: string;
  featureId: number;
  analysisType: AnalysisType;
  content: string; // JSON string
  tokenCount: number | null;
  duration: number;
  createdAt: number;
}

/**
 * Parsed analysis result for display
 */
export interface ParsedAnalysisResult<T = unknown> {
  id: number;
  requestId: string;
  featureId: number;
  analysisType: AnalysisType;
  content: T;
  tokenCount: number | null;
  duration: number;
  createdAt: number;
}

/**
 * Summary analysis output
 */
export interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

/**
 * Discrepancy found during consistency check
 */
export interface Discrepancy {
  type: "missing" | "mismatch" | "extra";
  file1: string;
  file2: string;
  section: string;
  description: string;
  severity: "high" | "medium" | "low";
}

/**
 * Consistency check analysis output
 */
export interface ConsistencyResult {
  discrepancies: Discrepancy[];
  overallConsistency: number;
  filesAnalyzed: string[];
}

/**
 * Gap found during gap analysis
 */
export interface Gap {
  section: string;
  issue: string;
  suggestion: string;
  severity: "critical" | "important" | "minor";
}

/**
 * Gap analysis output
 */
export interface GapResult {
  gaps: Gap[];
  completeness: number;
  sectionsAnalyzed: string[];
}

/**
 * Analysis history record for list view
 */
export interface AnalysisRecord {
  id: number;
  requestId: string;
  analysisType: AnalysisType;
  createdAt: number;
  duration: number;
  tokenCount: number | null;
  preview: string;
}

// ============================================================================
// IPC Request/Response Types
// ============================================================================

/**
 * AI provider configure request
 */
export interface ConfigureProviderRequest {
  provider: AIProviderType;
  config: OpenAIConfig | OllamaConfig;
}

/**
 * AI provider switch request
 */
export interface SwitchProviderRequest {
  provider: AIProviderType;
}

/**
 * Test connection request
 */
export interface TestConnectionRequest {
  provider: AIProviderType;
}

/**
 * Test connection response data
 */
export interface TestConnectionResult {
  available: boolean;
  latency: number;
  models?: string[];
  error?: string;
}

/**
 * Generate summary request
 */
export interface GenerateSummaryRequest {
  featureId: number;
  filePath: string;
}

/**
 * Check consistency request
 */
export interface CheckConsistencyRequest {
  featureId: number;
  files: string[];
}

/**
 * Find gaps request
 */
export interface FindGapsRequest {
  featureId: number;
  filePath: string;
}

/**
 * Get analysis history request
 */
export interface GetAnalysisHistoryRequest {
  featureId: number;
  analysisType?: AnalysisType;
  limit?: number;
}

/**
 * Get analysis result request
 */
export interface GetAnalysisResultRequest {
  requestId: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * In-memory cache entry for analysis results
 */
export interface AnalysisCacheEntry {
  key: string;
  value: AnalysisResult;
  expiresAt: number;
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

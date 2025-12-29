/**
 * AI Analysis Hook
 * Provides methods for AI-powered document analysis
 */

import { useCallback, useState } from "react";
import { useAIProvider } from "../contexts/AIProviderContext";

// ============================================================================
// Types
// ============================================================================

export interface SummaryResult {
  requestId: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  duration: number;
  tokenCount?: number;
}

export interface Discrepancy {
  type: "missing" | "mismatch" | "extra";
  file1: string;
  file2: string;
  section: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface ConsistencyResult {
  requestId: string;
  discrepancies: Discrepancy[];
  overallConsistency: number;
  filesAnalyzed: string[];
  duration: number;
  tokenCount?: number;
}

export interface Gap {
  section: string;
  issue: string;
  suggestion: string;
  severity: "critical" | "important" | "minor";
}

export interface GapResult {
  requestId: string;
  gaps: Gap[];
  completeness: number;
  sectionsAnalyzed: string[];
  duration: number;
  tokenCount?: number;
}

export interface AnalysisRecord {
  id: number;
  requestId: string;
  analysisType: string;
  createdAt: number;
  duration: number;
  tokenCount: number | null;
  preview: string;
}

interface UseAIAnalysisReturn {
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  generateSummary: (
    featureId: number,
    filePath: string,
  ) => Promise<SummaryResult | null>;
  checkConsistency: (
    featureId: number,
    files: string[],
  ) => Promise<ConsistencyResult | null>;
  findGaps: (featureId: number, filePath: string) => Promise<GapResult | null>;
  getHistory: (
    featureId: number,
    type?: string,
    limit?: number,
  ) => Promise<AnalysisRecord[]>;
  getResult: (requestId: string) => Promise<unknown | null>;
  clearError: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAIAnalysis(): UseAIAnalysisReturn {
  const { isConfigured } = useAIProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const generateSummary = useCallback(
    async (
      featureId: number,
      filePath: string,
    ): Promise<SummaryResult | null> => {
      if (!isConfigured) {
        setError(
          "AI provider not configured. Please configure OpenAI or Ollama in settings.",
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.generateSummary(
          featureId,
          filePath,
        );

        if (response.success && response.data) {
          return response.data as SummaryResult;
        }

        setError(
          "error" in response ? response.error : "Failed to generate summary",
        );
        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Summary generation failed",
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured],
  );

  const checkConsistency = useCallback(
    async (
      featureId: number,
      files: string[],
    ): Promise<ConsistencyResult | null> => {
      if (!isConfigured) {
        setError(
          "AI provider not configured. Please configure OpenAI or Ollama in settings.",
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.checkConsistency(
          featureId,
          files,
        );

        if (response.success && response.data) {
          return response.data as ConsistencyResult;
        }

        setError(
          "error" in response ? response.error : "Failed to check consistency",
        );
        return null;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Consistency check failed",
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured],
  );

  const findGaps = useCallback(
    async (featureId: number, filePath: string): Promise<GapResult | null> => {
      if (!isConfigured) {
        setError(
          "AI provider not configured. Please configure OpenAI or Ollama in settings.",
        );
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.findGaps(featureId, filePath);

        if (response.success && response.data) {
          return response.data as GapResult;
        }

        setError("error" in response ? response.error : "Failed to find gaps");
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gap analysis failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConfigured],
  );

  const getHistory = useCallback(
    async (
      featureId: number,
      type?: string,
      limit?: number,
    ): Promise<AnalysisRecord[]> => {
      try {
        const response = await window.electronAPI.getAnalysisHistory(
          featureId,
          type,
          limit,
        );

        if (response.success && response.data?.analyses) {
          return response.data.analyses as AnalysisRecord[];
        }

        return [];
      } catch {
        return [];
      }
    },
    [],
  );

  const getResult = useCallback(
    async (requestId: string): Promise<unknown | null> => {
      try {
        const response = await window.electronAPI.getAnalysisResult(requestId);

        if (response.success && response.data) {
          return response.data;
        }

        return null;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    isLoading,
    error,
    isConfigured,
    generateSummary,
    checkConsistency,
    findGaps,
    getHistory,
    getResult,
    clearError,
  };
}

export default useAIAnalysis;

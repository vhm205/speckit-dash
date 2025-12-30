/**
 * Analysis Service
 * Orchestrates AI-powered analysis of specification documents
 * Supports summary generation, consistency checking, and gap analysis
 */

import { generateText } from "ai";
import { aiProviderService } from "./ai-provider";
import { databaseService } from "./database";
import fs from "fs";
import path from "path";

// Dynamic import for uuid (ES module in CommonJS context)
// Using Function constructor to prevent TypeScript from converting to require()
async function generateUUID(): Promise<string> {
  const importFn = new Function("specifier", "return import(specifier)");
  const { v4 } = await importFn("uuid");
  return v4();
}

// ============================================================================
// Types
// ============================================================================

export type AnalysisType = "summary" | "consistency" | "gaps";

export interface Discrepancy {
  type: "missing" | "mismatch" | "extra";
  file1: string;
  file2: string;
  section: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface Gap {
  section: string;
  issue: string;
  suggestion: string;
  severity: "critical" | "important" | "minor";
}

export interface SummaryResult {
  requestId: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  duration: number;
  tokenCount?: number;
}

export interface ConsistencyResult {
  requestId: string;
  discrepancies: Discrepancy[];
  overallConsistency: number;
  filesAnalyzed: string[];
  duration: number;
  tokenCount?: number;
}

export interface GapResult {
  requestId: string;
  gaps: Gap[];
  completeness: number;
  sectionsAnalyzed: string[];
  duration: number;
  tokenCount?: number;
}

// ============================================================================
// In-Memory Cache
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class AnalysisCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  invalidate(featureId: number): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`feature:${featureId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Prompt Templates
// ============================================================================

const SUMMARY_PROMPT =
  `You are analyzing a software specification document. Generate a concise summary that captures the key requirements and objectives.

Document content:
---
{content}
---

Respond with a JSON object in this exact format:
{
  "summary": "A 2-3 paragraph summary of the document's main purpose and requirements",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "wordCount": <number of words in the original document>
}

Focus on:
- The main goal or feature being specified
- Key user requirements and acceptance criteria
- Important constraints or dependencies
- Success metrics if defined`;

const CONSISTENCY_PROMPT =
  `You are analyzing multiple specification documents for a software feature. Check for consistency and identify any discrepancies between them.

Documents to analyze:
{documents}

Respond with a JSON object in this exact format:
{
  "discrepancies": [
    {
      "type": "missing" | "mismatch" | "extra",
      "file1": "filename1",
      "file2": "filename2",
      "section": "Section name where issue was found",
      "description": "Clear description of the discrepancy",
      "severity": "high" | "medium" | "low"
    }
  ],
  "overallConsistency": <0-100 percentage score>
}

Look for:
- Requirements in spec.md that don't have corresponding tasks
- Tasks that reference features not in the spec
- Mismatched terminology or naming
- Conflicting priorities or status information
- Missing or incomplete connections between documents`;

const GAP_PROMPT =
  `You are analyzing a software specification document to identify gaps and areas needing improvement.

Document content:
---
{content}
---

Respond with a JSON object in this exact format:
{
  "gaps": [
    {
      "section": "Section name",
      "issue": "Description of what's missing or unclear",
      "suggestion": "Recommendation for improvement",
      "severity": "critical" | "important" | "minor"
    }
  ],
  "completeness": <0-100 percentage score>,
  "sectionsAnalyzed": ["Section 1", "Section 2", ...]
}

Look for:
- Missing acceptance criteria for requirements
- Unclear or ambiguous requirements
- Missing edge case handling
- Incomplete user stories
- Undefined success metrics
- Missing dependencies or assumptions`;

// ============================================================================
// Analysis Service Class
// ============================================================================

class AnalysisService {
  private cache = new AnalysisCache();

  // ========================================
  // Summary Generation
  // ========================================

  /**
  /**
   * Generate or retrieve a summary of a specification document
   */
  async generateSummary(
    featureId: number,
    filePath: string,
    force: boolean = false,
  ): Promise<SummaryResult> {
    const cacheKey = `feature:${featureId}:summary:${filePath}`;

    // 1. Check in-memory cache if not forced
    if (!force) {
      const cached = this.cache.get<SummaryResult>(cacheKey);
      if (cached) return cached;

      // 2. Check database
      const latest = databaseService.getLatestAnalysisResult(
        featureId,
        "summary",
        filePath,
      );
      if (latest) {
        try {
          const result = JSON.parse(latest.content) as SummaryResult;
          // Refresh cache
          this.cache.set(cacheKey, result);
          return result;
        } catch (err) {
          console.error("Failed to parse cached summary from DB", err);
          // Proceed to generation if DB content is corrupt
        }
      }
    }

    const startTime = Date.now();
    const requestId = await generateUUID();

    // Read file content
    const content = this.readFile(filePath);

    if (!content) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get AI provider and generate
    const model = await aiProviderService.getActiveProvider();
    const prompt = SUMMARY_PROMPT.replace("{content}", content);

    const { text, usage } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    // Parse response
    let parsed: { summary: string; keyPoints: string[]; wordCount: number };
    try {
      parsed = JSON.parse(this.extractJSON(text));
    } catch (error) {
      console.error("JSON parsing of AI response failed", error);
      // Fallback if JSON parsing fails
      parsed = {
        summary: text,
        keyPoints: [],
        wordCount: content.split(/\s+/).length,
      };
    }

    const duration = Date.now() - startTime;
    const tokenCount = usage?.totalTokens;

    const result: SummaryResult = {
      requestId,
      summary: parsed.summary,
      keyPoints: parsed.keyPoints,
      wordCount: parsed.wordCount,
      duration,
      tokenCount,
    };

    // Store in database
    databaseService.createAnalysisResult(
      requestId,
      featureId,
      "summary",
      JSON.stringify(result),
      duration,
      tokenCount,
      filePath,
    );

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // ========================================
  // Consistency Check
  // ========================================

  /**
   * Check consistency across multiple specification files
   */
  async checkConsistency(
    featureId: number,
    files: string[],
  ): Promise<ConsistencyResult> {
    const cacheKey = `feature:${featureId}:consistency:${
      files.sort().join(",")
    }`;
    const cached = this.cache.get<ConsistencyResult>(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    const requestId = await generateUUID();

    // Read all files
    const documents = files.map((filePath) => {
      const content = this.readFile(filePath);
      const fileName = path.basename(filePath);
      return `=== ${fileName} ===\n${content || "(File not found)"}`;
    }).join("\n\n");

    // Get AI provider and generate
    const model = await aiProviderService.getActiveProvider();
    const prompt = CONSISTENCY_PROMPT.replace("{documents}", documents);

    const { text, usage } = await generateText({
      model,
      prompt,
      temperature: 0.2,
    });

    // Parse response
    let parsed: { discrepancies: Discrepancy[]; overallConsistency: number };
    try {
      parsed = JSON.parse(this.extractJSON(text));
    } catch {
      parsed = {
        discrepancies: [],
        overallConsistency: 100,
      };
    }

    const duration = Date.now() - startTime;
    const tokenCount = usage?.totalTokens;

    const result: ConsistencyResult = {
      requestId,
      discrepancies: parsed.discrepancies,
      overallConsistency: parsed.overallConsistency,
      filesAnalyzed: files.map((f) => path.basename(f)),
      duration,
      tokenCount,
    };

    // Store in database
    databaseService.createAnalysisResult(
      requestId,
      featureId,
      "consistency",
      JSON.stringify(result),
      duration,
      tokenCount,
    );

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // ========================================
  // Gap Analysis
  // ========================================

  /**
   * Identify gaps in a specification document
   */
  async findGaps(featureId: number, filePath: string): Promise<GapResult> {
    const cacheKey = `feature:${featureId}:gaps:${filePath}`;
    const cached = this.cache.get<GapResult>(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    const requestId = await generateUUID();

    // Read file content
    const content = this.readFile(filePath);
    if (!content) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get AI provider and generate
    const model = await aiProviderService.getActiveProvider();
    const prompt = GAP_PROMPT.replace("{content}", content);

    const { text, usage } = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    // Parse response
    let parsed: {
      gaps: Gap[];
      completeness: number;
      sectionsAnalyzed: string[];
    };
    try {
      parsed = JSON.parse(this.extractJSON(text));
    } catch {
      parsed = {
        gaps: [],
        completeness: 100,
        sectionsAnalyzed: [],
      };
    }

    const duration = Date.now() - startTime;
    const tokenCount = usage?.totalTokens;

    const result: GapResult = {
      requestId,
      gaps: parsed.gaps,
      completeness: parsed.completeness,
      sectionsAnalyzed: parsed.sectionsAnalyzed,
      duration,
      tokenCount,
    };

    // Store in database
    databaseService.createAnalysisResult(
      requestId,
      featureId,
      "gaps",
      JSON.stringify(result),
      duration,
      tokenCount,
    );

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  // ========================================
  // History & Result Retrieval
  // ========================================

  /**
   * Get analysis history for a feature
   */
  getAnalysisHistory(
    featureId: number,
    analysisType?: AnalysisType,
    limit: number = 10,
  ): Array<{
    id: number;
    requestId: string;
    analysisType: string;
    createdAt: number;
    duration: number;
    tokenCount: number | null;
    preview: string;
  }> {
    const results = databaseService.getAnalysisResultsByFeature(
      featureId,
      analysisType,
      limit,
    );

    return results.map((r) => {
      // Generate preview from content
      let preview = "";
      try {
        const content = JSON.parse(r.content);
        if (content.summary) {
          preview = content.summary.substring(0, 200);
        } else if (content.discrepancies) {
          preview = `${content.discrepancies.length} discrepancies found`;
        } else if (content.gaps) {
          preview = `${content.gaps.length} gaps identified`;
        }
      } catch {
        preview = r.content.substring(0, 200);
      }

      return {
        id: r.id,
        requestId: r.request_id,
        analysisType: r.analysis_type,
        createdAt: r.created_at,
        duration: r.duration,
        tokenCount: r.token_count,
        preview: preview + (preview.length >= 200 ? "..." : ""),
      };
    });
  }

  /**
   * Get a specific analysis result by request ID
   */
  getAnalysisResult(requestId: string): unknown | null {
    const result = databaseService.getAnalysisResultByRequestId(requestId);
    if (!result) return null;

    try {
      return {
        ...result,
        content: JSON.parse(result.content),
      };
    } catch {
      return result;
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Read file content
   */
  private readFile(filePath: string): string | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  /**
   * Extract JSON from text that may contain markdown code blocks
   */
  private extractJSON(text: string): string {
    // Try to find JSON in markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Try to find raw JSON object
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return objectMatch[0];
    }

    return text;
  }

  /**
   * Invalidate cache for a feature
   */
  invalidateCache(featureId: number): void {
    this.cache.invalidate(featureId);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const analysisService = new AnalysisService();
export default analysisService;

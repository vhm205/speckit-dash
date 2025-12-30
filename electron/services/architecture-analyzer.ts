/**
 * Architecture Analyzer Service
 * Uses AI to analyze feature documentation and extract architecture components
 * Supports workflow visualization with actors, systems, processes, and data stores
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

export interface ArchitectureActor {
    id: string;
    label: string;
    type: "user" | "admin" | "system_user" | "external";
    description?: string;
}

export interface ArchitectureSystem {
    id: string;
    label: string;
    type: "external" | "internal" | "module" | "service";
    description?: string;
}

export interface ArchitectureProcess {
    id: string;
    label: string;
    description?: string;
}

export interface ArchitectureData {
    id: string;
    label: string;
    type: "database" | "cache" | "storage" | "queue";
    description?: string;
}

export interface ArchitectureConnection {
    id: string;
    from: string;
    to: string;
    label?: string;
    type?: "data_flow" | "control_flow" | "interaction";
}

export interface ArchitectureResult {
    requestId: string;
    actors: ArchitectureActor[];
    systems: ArchitectureSystem[];
    processes: ArchitectureProcess[];
    dataStores: ArchitectureData[];
    connections: ArchitectureConnection[];
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

class ArchitectureCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + this.TTL_MS,
        });
    }

    invalidate(featureId: number): void {
        const prefix = `architecture:${featureId}`;
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

// ============================================================================
// Prompt Template
// ============================================================================

const ARCHITECTURE_PROMPT = `You are analyzing software feature documentation to extract architectural workflow information.

Your task is to identify the key architectural components and their interactions:
- **Actors**: Users, roles, or external entities that interact with the system
- **Systems**: External systems, modules, services, or components
- **Processes**: Actions, operations, workflows, or business logic steps
- **Data Stores**: Databases, caches, storage systems, or data repositories
- **Connections**: How these components interact (data flow, control flow, interactions)

Documentation files:
{documents}

Respond with a JSON object in this exact format:
{
  "actors": [
    {
      "id": "unique_id",
      "label": "Actor Name",
      "type": "user" | "admin" | "system_user" | "external",
      "description": "Optional description"
    }
  ],
  "systems": [
    {
      "id": "unique_id",
      "label": "System/Module Name",
      "type": "external" | "internal" | "module" | "service",
      "description": "Optional description"
    }
  ],
  "processes": [
    {
      "id": "unique_id",
      "label": "Process/Action Name",
      "description": "Optional description of what this process does"
    }
  ],
  "dataStores": [
    {
      "id": "unique_id",
      "label": "Database/Storage Name",
      "type": "database" | "cache" | "storage" | "queue",
      "description": "Optional description"
    }
  ],
  "connections": [
    {
      "id": "unique_id",
      "from": "source_component_id",
      "to": "target_component_id",
      "label": "Optional description of the interaction",
      "type": "data_flow" | "control_flow" | "interaction"
    }
  ]
}

Guidelines:
- Use snake_case for IDs (e.g., "teacher_actor", "moodle_system", "score_process")
- Be specific and concise with labels
- Connections should link actual component IDs from actors, systems, processes, or dataStores
- Focus on the main workflow, not every minor detail
- If no components found in a category, return empty array
- Ensure valid JSON format`;

// ============================================================================
// Architecture Analyzer Service Class
// ============================================================================

class ArchitectureAnalyzer {
    private cache = new ArchitectureCache();

    /**
     * Analyze architecture of a feature by reading all documentation files
     */
    async analyzeArchitecture(
        featureId: number,
        force: boolean = false,
    ): Promise<ArchitectureResult> {
        const startTime = Date.now();

        // Check database first (unless forced)
        if (!force) {
            const dbResult = databaseService.getArchitectureAnalysis(featureId);
            if (dbResult) {
                // Parse JSON fields and return
                const analysisResult: ArchitectureResult = {
                    requestId: dbResult.request_id,
                    actors: JSON.parse(dbResult.actors),
                    systems: JSON.parse(dbResult.systems),
                    processes: JSON.parse(dbResult.processes),
                    dataStores: JSON.parse(dbResult.data_stores),
                    connections: JSON.parse(dbResult.connections),
                    duration: dbResult.duration,
                    tokenCount: dbResult.token_count ?? undefined,
                };

                // Also cache in memory for faster subsequent access
                const cacheKey = `architecture:${featureId}`;
                this.cache.set(cacheKey, analysisResult);

                return analysisResult;
            }

            // Check in-memory cache as fallback
            const cacheKey = `architecture:${featureId}`;
            const cached = this.cache.get<ArchitectureResult>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Get feature details from database
        const feature = databaseService.getFeatureById(featureId);
        if (!feature) {
            throw new Error(`Feature with ID ${featureId} not found`);
        }

        // Extract feature directory path from spec_path
        const featurePath = path.dirname(feature.spec_path);

        // Read all markdown documentation files
        const documents = await this.readFeatureDocuments(featurePath);

        if (documents.length === 0) {
            throw new Error("No documentation files found for this feature");
        }

        // Generate AI analysis
        const requestId = await generateUUID();
        const model = await aiProviderService.getActiveProvider();

        // Format documents for prompt
        const documentsText = documents
            .map((doc) => `## File: ${doc.fileName}\n\n${doc.content}`)
            .join("\n\n---\n\n");

        const prompt = ARCHITECTURE_PROMPT.replace("{documents}", documentsText);

        try {
            const result = await generateText({
                model,
                prompt,
                temperature: 0.3, // Lower temperature for more consistent results
            });

            // Parse JSON response
            const architectureData = this.parseArchitectureResponse(result.text);

            const duration = Date.now() - startTime;
            const analysisResult: ArchitectureResult = {
                requestId,
                ...architectureData,
                duration,
                tokenCount: result.usage?.totalTokens,
            };

            // Save to database
            databaseService.saveArchitectureAnalysis(
                featureId,
                requestId,
                analysisResult.actors,
                analysisResult.systems,
                analysisResult.processes,
                analysisResult.dataStores,
                analysisResult.connections,
                duration,
                result.usage?.totalTokens,
            );

            // Cache the result in memory
            const cacheKey = `architecture:${featureId}`;
            this.cache.set(cacheKey, analysisResult);

            return analysisResult;
        } catch (error) {
            throw new Error(
                `Architecture analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    }

    /**
     * Read all markdown documentation files for a feature
     */
    private async readFeatureDocuments(
        featurePath: string,
    ): Promise<Array<{ fileName: string; content: string }>> {
        const documents: Array<{ fileName: string; content: string }> = [];

        // List of documentation files to read (in priority order)
        const fileNames = [
            "spec.md",
            "plan.md",
            "research.md",
            "tasks.md",
            "requirements.md",
            "quickstart.md",
            "data-model.md",
        ];

        for (const fileName of fileNames) {
            const filePath = path.join(featurePath, fileName);

            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, "utf-8");
                    documents.push({ fileName, content });
                } catch (error) {
                    console.warn(`Failed to read ${fileName}:`, error);
                }
            }
        }

        // Also check contracts directory
        const contractsDir = path.join(featurePath, "contracts");
        if (fs.existsSync(contractsDir)) {
            const contractFiles = fs.readdirSync(contractsDir).filter((f) => f.endsWith(".md"));
            for (const fileName of contractFiles) {
                try {
                    const content = fs.readFileSync(path.join(contractsDir, fileName), "utf-8");
                    documents.push({ fileName: `contracts/${fileName}`, content });
                } catch (error) {
                    console.warn(`Failed to read contracts/${fileName}:`, error);
                }
            }
        }

        return documents;
    }

    /**
     * Parse AI response and extract architecture data
     */
    private parseArchitectureResponse(responseText: string): {
        actors: ArchitectureActor[];
        systems: ArchitectureSystem[];
        processes: ArchitectureProcess[];
        dataStores: ArchitectureData[];
        connections: ArchitectureConnection[];
    } {
        // Extract JSON from response (may be wrapped in markdown code blocks)
        const jsonText = this.extractJSON(responseText);

        try {
            const parsed = JSON.parse(jsonText);

            return {
                actors: parsed.actors || [],
                systems: parsed.systems || [],
                processes: parsed.processes || [],
                dataStores: parsed.dataStores || [],
                connections: parsed.connections || [],
            };
        } catch (error) {
            console.error("Failed to parse architecture response:", error);
            console.error("Response text:", responseText);
            throw new Error("Failed to parse AI response as valid JSON");
        }
    }

    /**
     * Extract JSON from text that may contain markdown code blocks
     */
    private extractJSON(text: string): string {
        // Try to find JSON in markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
            return codeBlockMatch[1];
        }

        // Try to find raw JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
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

// ============================================================================
// Singleton Export
// ============================================================================

export const architectureAnalyzer = new ArchitectureAnalyzer();

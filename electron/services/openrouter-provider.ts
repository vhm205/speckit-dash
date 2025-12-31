/**
 * OpenRouter Provider for Vercel AI SDK
 * Provides access to multiple AI models through OpenRouter's unified API
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// ============================================================================
// Types
// ============================================================================

export interface OpenRouterProviderConfig {
    apiKey: string;
    siteUrl?: string;
    appName?: string;
}

interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

interface OpenRouterModelsResponse {
    data: OpenRouterModel[];
}

// ============================================================================
// OpenRouter Provider Class
// ============================================================================

export class OpenRouterProvider {
    private config: OpenRouterProviderConfig;
    private openaiCompatClient: ReturnType<typeof createOpenAI> | null = null;

    constructor(config: OpenRouterProviderConfig) {
        this.config = config;
    }

    /**
     * Initialize the OpenAI-compatible client for OpenRouter
     */
    private initClient(): void {
        if (this.openaiCompatClient) return;

        const headers: Record<string, string> = {};

        if (this.config.siteUrl) {
            headers["HTTP-Referer"] = this.config.siteUrl;
        }

        if (this.config.appName) {
            headers["X-Title"] = this.config.appName;
        }

        // OpenRouter uses OpenAI-compatible API
        this.openaiCompatClient = createOpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: this.config.apiKey,
            headers,
        });
    }

    /**
     * Get a language model for the specified model ID
     */
    getModel(modelId: string): LanguageModel {
        this.initClient();
        return this.openaiCompatClient!(modelId);
    }

    /**
     * List available models from OpenRouter
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models/user", {
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                console.error("Failed to fetch OpenRouter models:", response.statusText);
                return [];
            }

            const data = (await response.json()) as OpenRouterModelsResponse;
            return data.data?.map((m: OpenRouterModel) => m.id) || [];
        } catch (error) {
            console.error("Error fetching OpenRouter models:", error);
            return [];
        }
    }

    /**
     * Test connection to OpenRouter
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch("https://openrouter.ai/api/v1/models/user", {
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                signal: AbortSignal.timeout(10000),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<OpenRouterProviderConfig>): void {
        this.config = { ...this.config, ...config };
        // Reset client to force re-initialization with new config
        this.openaiCompatClient = null;
    }
}

/**
 * Create an OpenRouter provider instance
 */
export function createOpenRouterProvider(
    config: OpenRouterProviderConfig,
): OpenRouterProvider {
    return new OpenRouterProvider(config);
}

export default OpenRouterProvider;

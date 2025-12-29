/**
 * Custom Ollama Provider for Vercel AI SDK
 * Simple wrapper that uses Ollama's OpenAI-compatible API
 */

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// ============================================================================
// Types
// ============================================================================

export interface OllamaProviderConfig {
  baseURL?: string;
  timeout?: number;
}

// ============================================================================
// Ollama Provider Class
// ============================================================================

export class OllamaProvider {
  private config: OllamaProviderConfig;
  private openaiCompatClient: ReturnType<typeof createOpenAI> | null = null;

  constructor(config: OllamaProviderConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "http://localhost:11434",
      timeout: config.timeout || 60000,
    };
  }

  /**
   * Initialize the OpenAI-compatible client for Ollama
   */
  private initClient(): void {
    if (this.openaiCompatClient) return;

    // Ollama exposes an OpenAI-compatible endpoint at /v1
    this.openaiCompatClient = createOpenAI({
      baseURL: `${this.config.baseURL}/v1`,
      apiKey: "ollama", // Ollama doesn't require a real API key
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
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseURL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create an Ollama provider instance
 */
export function createOllamaProvider(
  config?: OllamaProviderConfig,
): OllamaProvider {
  return new OllamaProvider(config);
}

export default OllamaProvider;

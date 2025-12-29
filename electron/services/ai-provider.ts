/**
 * AI Provider Service
 * Manages AI provider configuration, initialization, and switching
 * Supports OpenAI and Ollama providers via Vercel AI SDK
 */

import { createOpenAI } from "@ai-sdk/openai";
import Store from "electron-store";
import type { LanguageModel } from "ai";
import {
  decryptApiKey,
  encryptApiKey,
  isEncryptionAvailable,
} from "../utils/encryption";
import { createOllamaProvider, OllamaProvider } from "./ollama-provider";

// ============================================================================
// Types
// ============================================================================

export type AIProviderType = "openai" | "ollama";

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

export interface OllamaConfig {
  baseURL: string;
  model: string;
  timeout?: number;
}

interface StoredOpenAIConfig {
  encryptedApiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

interface StoredOllamaConfig {
  baseURL: string;
  model: string;
  timeout?: number;
}

interface AIProviderStore {
  activeProvider: AIProviderType | null;
  openai: StoredOpenAIConfig | null;
  ollama: StoredOllamaConfig | null;
}

export interface SafeOpenAIConfig {
  model: string;
  baseURL: string;
  hasApiKey: boolean;
}

export interface SafeOllamaConfig {
  baseURL: string;
  model: string;
  isRunning: boolean;
}

export interface AIProviderConfigResponse {
  activeProvider: AIProviderType | null;
  openai?: SafeOpenAIConfig;
  ollama?: SafeOllamaConfig;
}

export interface TestConnectionResult {
  available: boolean;
  latency: number;
  models?: string[];
  error?: string;
}

// ============================================================================
// AI Provider Service Class
// ============================================================================

class AIProviderService {
  private store: Store<AIProviderStore>;
  private openaiProvider: ReturnType<typeof createOpenAI> | null = null;
  private ollamaProvider: OllamaProvider | null = null;

  constructor() {
    this.store = new Store<AIProviderStore>({
      name: "ai-providers",
      defaults: {
        activeProvider: null,
        openai: null,
        ollama: null,
      },
    });
  }

  // ========================================
  // Configuration Methods
  // ========================================

  /**
   * Configure OpenAI provider
   */
  async configureOpenAI(config: OpenAIConfig): Promise<void> {
    // Encrypt API key before storing
    const { encrypted } = encryptApiKey(config.apiKey);

    const storedConfig: StoredOpenAIConfig = {
      encryptedApiKey: encrypted,
      model: config.model,
      baseURL: config.baseURL,
      organization: config.organization,
    };

    this.store.set("openai", storedConfig);

    // Initialize provider
    this.initializeOpenAI(config.apiKey, config);

    // Set as active if no provider is active
    if (!this.store.get("activeProvider")) {
      this.store.set("activeProvider", "openai");
    }
  }

  /**
   * Configure Ollama provider
   */
  async configureOllama(config: OllamaConfig): Promise<void> {
    const storedConfig: StoredOllamaConfig = {
      baseURL: config.baseURL,
      model: config.model,
      timeout: config.timeout,
    };

    this.store.set("ollama", storedConfig);

    // Initialize provider
    this.initializeOllama(config);

    // Set as active if no provider is active
    if (!this.store.get("activeProvider")) {
      this.store.set("activeProvider", "ollama");
    }
  }

  /**
   * Get current configuration (safe for renderer - no API keys)
   */
  async getConfig(): Promise<AIProviderConfigResponse> {
    const activeProvider = this.store.get("activeProvider");
    const openaiConfig = this.store.get("openai");
    const ollamaConfig = this.store.get("ollama");

    const response: AIProviderConfigResponse = {
      activeProvider,
    };

    if (openaiConfig) {
      response.openai = {
        model: openaiConfig.model,
        baseURL: openaiConfig.baseURL || "https://api.openai.com/v1",
        hasApiKey: !!openaiConfig.encryptedApiKey,
      };
    }

    if (ollamaConfig) {
      // Check if Ollama is running
      let isRunning = false;
      try {
        const result = await this.testConnection("ollama");
        isRunning = result.available;
      } catch {
        isRunning = false;
      }

      response.ollama = {
        baseURL: ollamaConfig.baseURL,
        model: ollamaConfig.model,
        isRunning,
      };
    }

    return response;
  }

  /**
   * Switch active provider
   */
  async switchProvider(provider: AIProviderType): Promise<void> {
    // Verify provider is configured
    const config = provider === "openai"
      ? this.store.get("openai")
      : this.store.get("ollama");

    if (!config) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    // For Ollama, verify it's running
    if (provider === "ollama") {
      const result = await this.testConnection("ollama");
      if (!result.available) {
        throw new Error("Ollama is not running. Please start Ollama first.");
      }
    }

    this.store.set("activeProvider", provider);
  }

  // ========================================
  // Provider Access Methods
  // ========================================

  /**
   * Get the active language model for AI operations
   */
  async getActiveProvider(): Promise<LanguageModel> {
    const activeProvider = this.store.get("activeProvider");

    if (!activeProvider) {
      throw new Error(
        "No AI provider configured. Please configure OpenAI or Ollama in settings.",
      );
    }

    if (activeProvider === "openai") {
      return this.getOpenAIModel();
    } else {
      return this.getOllamaModel();
    }
  }

  /**
   * Get OpenAI language model
   */
  private getOpenAIModel(): LanguageModel {
    const config = this.store.get("openai");
    if (!config) {
      throw new Error("OpenAI is not configured");
    }

    if (!this.openaiProvider) {
      const apiKey = decryptApiKey(config.encryptedApiKey);
      this.initializeOpenAI(apiKey, config);
    }

    return this.openaiProvider!(config.model);
  }

  /**
   * Get Ollama language model
   */
  private getOllamaModel(): LanguageModel {
    const config = this.store.get("ollama");
    if (!config) {
      throw new Error("Ollama is not configured");
    }

    if (!this.ollamaProvider) {
      this.initializeOllama(config);
    }

    return this.ollamaProvider!.getModel(config.model);
  }

  // ========================================
  // Initialization Methods
  // ========================================

  private initializeOpenAI(
    apiKey: string,
    config: { baseURL?: string; organization?: string },
  ): void {
    this.openaiProvider = createOpenAI({
      apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
  }

  private initializeOllama(config: OllamaConfig): void {
    this.ollamaProvider = createOllamaProvider({
      baseURL: config.baseURL,
      timeout: config.timeout,
    });
  }

  // ========================================
  // Connection Testing
  // ========================================

  /**
   * Test connection to a provider
   */
  async testConnection(
    provider: AIProviderType,
  ): Promise<TestConnectionResult> {
    const startTime = Date.now();

    if (provider === "openai") {
      return this.testOpenAIConnection(startTime);
    } else {
      return this.testOllamaConnection(startTime);
    }
  }

  private async testOpenAIConnection(
    startTime: number,
  ): Promise<TestConnectionResult> {
    const config = this.store.get("openai");
    if (!config) {
      return {
        available: false,
        latency: 0,
        error: "OpenAI is not configured",
      };
    }

    try {
      const apiKey = decryptApiKey(config.encryptedApiKey);
      const baseURL = config.baseURL || "https://api.openai.com/v1";

      const response = await fetch(`${baseURL}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          available: false,
          latency,
          error: response.status === 401
            ? "Invalid API key"
            : `API error: ${response.status}`,
        };
      }

      const data = (await response.json()) as { data: { id: string }[] };
      const models = data.data?.map((m: { id: string }) => m.id) || [];

      return {
        available: true,
        latency,
        models: models.slice(0, 10), // Return first 10 models
      };
    } catch (error) {
      return {
        available: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  private async testOllamaConnection(
    startTime: number,
  ): Promise<TestConnectionResult> {
    const config = this.store.get("ollama");
    const baseURL = config?.baseURL || "http://localhost:11434";

    try {
      const response = await fetch(`${baseURL}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          available: false,
          latency,
          error: `Ollama returned status ${response.status}`,
        };
      }

      const data = (await response.json()) as { models: { name: string }[] };
      const models = data.models?.map((m: { name: string }) => m.name) || [];

      return {
        available: true,
        latency,
        models,
      };
    } catch (error) {
      return {
        available: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Ollama is not running",
      };
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Check if encryption is available for API key storage
   */
  isSecureStorageAvailable(): boolean {
    return isEncryptionAvailable();
  }

  /**
   * Get the active provider type
   */
  getActiveProviderType(): AIProviderType | null {
    return this.store.get("activeProvider");
  }

  /**
   * Clear all provider configurations
   */
  clearConfig(): void {
    this.store.clear();
    this.openaiProvider = null;
    this.ollamaProvider = null;
  }
}

// Export singleton instance
export const aiProviderService = new AIProviderService();
export default aiProviderService;

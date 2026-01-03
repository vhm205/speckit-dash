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
import {
  createOpenRouterProvider,
  OpenRouterProvider,
} from "./openrouter-provider";

// ============================================================================
// Types
// ============================================================================

export type AIProviderType = "openai" | "ollama" | "openrouter";

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

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
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

interface StoredOpenRouterConfig {
  encryptedApiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
}

interface AIProviderStore {
  activeProvider: AIProviderType | null;
  openai: StoredOpenAIConfig | null;
  ollama: StoredOllamaConfig | null;
  openrouter: StoredOpenRouterConfig | null;
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

export interface SafeOpenRouterConfig {
  model: string;
  hasApiKey: boolean;
  siteUrl?: string;
  appName?: string;
}

export interface AIProviderConfigResponse {
  activeProvider: AIProviderType | null;
  openai?: SafeOpenAIConfig;
  ollama?: SafeOllamaConfig;
  openrouter?: SafeOpenRouterConfig;
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
  private openrouterProvider: OpenRouterProvider | null = null;

  constructor() {
    this.store = new Store<AIProviderStore>({
      name: "ai-providers",
      defaults: {
        activeProvider: null,
        openai: null,
        ollama: null,
        openrouter: null,
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
    // Handle API key - preserve existing if not changed
    let encryptedApiKey: string;
    let apiKeyToUse: string;

    if (config.apiKey === "__EXISTING_KEY__") {
      // User didn't change the API key, preserve existing
      const existingConfig = this.store.get("openai");
      if (!existingConfig?.encryptedApiKey) {
        throw new Error("No existing API key found");
      }
      encryptedApiKey = existingConfig.encryptedApiKey;
      apiKeyToUse = decryptApiKey(encryptedApiKey);
    } else {
      // New API key provided, encrypt it
      const { encrypted } = encryptApiKey(config.apiKey);
      encryptedApiKey = encrypted;
      apiKeyToUse = config.apiKey;
    }

    const storedConfig: StoredOpenAIConfig = {
      encryptedApiKey,
      model: config.model,
      baseURL: config.baseURL,
      organization: config.organization,
    };

    this.store.set("openai", storedConfig);

    // Initialize provider
    this.initializeOpenAI(apiKeyToUse, config);

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
   * Configure OpenRouter provider
   */
  async configureOpenRouter(config: OpenRouterConfig): Promise<void> {
    // Handle API key - preserve existing if not changed
    let encryptedApiKey: string;
    let apiKeyToUse: string;

    if (config.apiKey === "__EXISTING_KEY__") {
      // User didn't change the API key, preserve existing
      const existingConfig = this.store.get("openrouter");
      if (!existingConfig?.encryptedApiKey) {
        throw new Error("No existing API key found");
      }
      encryptedApiKey = existingConfig.encryptedApiKey;
      apiKeyToUse = decryptApiKey(encryptedApiKey);
    } else {
      // New API key provided, encrypt it
      const { encrypted } = encryptApiKey(config.apiKey);
      encryptedApiKey = encrypted;
      apiKeyToUse = config.apiKey;
    }

    const storedConfig: StoredOpenRouterConfig = {
      encryptedApiKey,
      model: config.model,
      siteUrl: config.siteUrl,
      appName: config.appName,
    };

    this.store.set("openrouter", storedConfig);

    // Initialize provider
    this.initializeOpenRouter(apiKeyToUse, config);

    // Set as active if no provider is active
    if (!this.store.get("activeProvider")) {
      this.store.set("activeProvider", "openrouter");
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

    const openrouterConfig = this.store.get("openrouter");
    if (openrouterConfig) {
      response.openrouter = {
        model: openrouterConfig.model,
        hasApiKey: !!openrouterConfig.encryptedApiKey,
        siteUrl: openrouterConfig.siteUrl,
        appName: openrouterConfig.appName,
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
      : provider === "ollama"
      ? this.store.get("ollama")
      : this.store.get("openrouter");

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
    } else if (activeProvider === "ollama") {
      return this.getOllamaModel();
    } else {
      return this.getOpenRouterModel();
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

  /**
   * Get OpenRouter language model
   */
  private getOpenRouterModel(): LanguageModel {
    const config = this.store.get("openrouter");
    if (!config) {
      throw new Error("OpenRouter is not configured");
    }

    if (!this.openrouterProvider) {
      const apiKey = decryptApiKey(config.encryptedApiKey);
      this.initializeOpenRouter(apiKey, config);
    }

    return this.openrouterProvider!.getModel(config.model);
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

  private initializeOpenRouter(
    apiKey: string,
    config: { siteUrl?: string; appName?: string },
  ): void {
    this.openrouterProvider = createOpenRouterProvider({
      apiKey,
      siteUrl: config.siteUrl,
      appName: config.appName,
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
    } else if (provider === "ollama") {
      return this.testOllamaConnection(startTime);
    } else {
      return this.testOpenRouterConnection(startTime);
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

      const allModels = data.data?.map((m: { id: string }) => m.id) || [];

      // Filter models suitable for context analysis (chat completion models)
      // Exclude embedding, audio, image, and moderation models
      const filteredModels = this.filterOpenAIModelsForContextAnalysis(
        allModels,
      );

      return {
        available: true,
        latency,
        models: filteredModels,
      };
    } catch (error) {
      return {
        available: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Filter OpenAI models to only include those suitable for context analysis
   * Returns models in order of cost-effectiveness and capability
   */
  private filterOpenAIModelsForContextAnalysis(models: string[]): string[] {
    // Models suitable for context analysis (chat completion)
    const suitablePatterns = [
      /^gpt-4o/, // GPT-4o models (latest, most capable)
      // /^gpt-4-turbo/, // GPT-4 Turbo models
      /^gpt-4/, // GPT-4 models
      /^gpt-5/, // GPT-5 models
      /^gpt-3\.5-turbo/, // GPT-3.5 Turbo models
      /^chatgpt-4o/, // ChatGPT-4o models
    ];

    // Exclude models not suitable for context analysis
    const excludePatterns = [
      /embedding/i, // Embedding models
      /whisper/i, // Audio models
      /audio/i, // Audio models
      /transcribe/i, // Audio models
      /realtime/i, // Audio models
      /tts/i, // Text-to-speech models
      /dall-e/i, // Image generation models
      /moderation/i, // Moderation models
      /instruct/i, // Instruct models (use chat models instead)
      /^text-/, // Legacy completion models
      /^davinci/, // Legacy models
      /^curie/, // Legacy models
      /^babbage/, // Legacy models
      /^ada/, // Legacy models
    ];

    // Filter models
    const filtered = models.filter((model) => {
      // Exclude if matches any exclude pattern
      if (excludePatterns.some((pattern) => pattern.test(model))) {
        return false;
      }
      // Include if matches any suitable pattern
      return suitablePatterns.some((pattern) => pattern.test(model));
    });

    // Sort by priority for default selection
    // Priority order: gpt-4o-mini, gpt-3.5-turbo, gpt-4o, gpt-4-turbo, others
    const priorityOrder = [
      "gpt-4o-mini", // Most cost-effective modern model
      "gpt-3.5-turbo", // Cost-effective legacy model
      "gpt-4o", // Latest, most capable
      "gpt-4-turbo-preview", // High capability
      "gpt-4-turbo", // High capability
      "gpt-4", // Standard GPT-4
    ];

    const sorted = filtered.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a);
      const indexB = priorityOrder.indexOf(b);

      // If both are in priority list, sort by priority
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in priority list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in priority list, B comes first
      if (indexB !== -1) return 1;
      // Otherwise maintain original order
      return 0;
    });

    console.log(
      `Filtered ${filtered.length} suitable models from ${models.length} total models`,
    );

    return sorted;
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

  private async testOpenRouterConnection(
    startTime: number,
  ): Promise<TestConnectionResult> {
    const config = this.store.get("openrouter");
    if (!config) {
      return {
        available: false,
        latency: 0,
        error: "OpenRouter is not configured",
      };
    }

    try {
      const apiKey = decryptApiKey(config.encryptedApiKey);

      const response = await fetch("https://openrouter.ai/api/v1/models/user", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
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
        models, // Return all models
      };
    } catch (error) {
      return {
        available: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Connection failed",
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

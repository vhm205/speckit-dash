/**
 * AI Provider Context
 * Manages AI provider state and configuration across the application
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export type AIProviderType = 'openai' | 'ollama';

interface SafeOpenAIConfig {
  model: string;
  baseURL: string;
  hasApiKey: boolean;
}

interface SafeOllamaConfig {
  baseURL: string;
  model: string;
  isRunning: boolean;
}

interface AIProviderConfig {
  activeProvider: AIProviderType | null;
  openai?: SafeOpenAIConfig;
  ollama?: SafeOllamaConfig;
}

interface TestConnectionResult {
  available: boolean;
  latency: number;
  models?: string[];
  error?: string;
}

interface AIProviderContextValue {
  config: AIProviderConfig | null;
  isLoading: boolean;
  error: string | null;
  activeProvider: AIProviderType | null;
  isConfigured: boolean;
  refreshConfig: () => Promise<void>;
  configureOpenAI: (apiKey: string, model: string, baseURL?: string) => Promise<boolean>;
  configureOllama: (baseURL: string, model: string) => Promise<boolean>;
  switchProvider: (provider: AIProviderType) => Promise<boolean>;
  testConnection: (provider: AIProviderType) => Promise<TestConnectionResult>;
}

// ============================================================================
// Context
// ============================================================================

const AIProviderContext = createContext<AIProviderContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AIProviderProviderProps {
  children: ReactNode;
}

export function AIProviderProvider({ children }: AIProviderProviderProps) {
  const [config, setConfig] = useState<AIProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial config
  useEffect(() => {
    refreshConfig();
  }, []);

  const refreshConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.getAIProviderConfig();
      if (response.success && response.data) {
        setConfig(response.data as AIProviderConfig);
      } else if (!response.success) {
        setError(response.error || 'Failed to load AI config');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI config');
    } finally {
      setIsLoading(false);
    }
  };

  const configureOpenAI = async (
    apiKey: string,
    model: string,
    baseURL?: string
  ): Promise<boolean> => {
    try {
      const response = await window.electronAPI.configureAIProvider('openai', {
        apiKey,
        model,
        baseURL,
      });

      if (response.success) {
        await refreshConfig();
        return true;
      }

      setError(response.error || 'Failed to configure OpenAI');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
      return false;
    }
  };

  const configureOllama = async (baseURL: string, model: string): Promise<boolean> => {
    try {
      const response = await window.electronAPI.configureAIProvider('ollama', {
        baseURL,
        model,
      });

      if (response.success) {
        await refreshConfig();
        return true;
      }

      setError(response.error || 'Failed to configure Ollama');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration failed');
      return false;
    }
  };

  const switchProvider = async (provider: AIProviderType): Promise<boolean> => {
    try {
      const response = await window.electronAPI.switchAIProvider(provider);

      if (response.success) {
        await refreshConfig();
        return true;
      }

      setError(response.error || 'Failed to switch provider');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Switch failed');
      return false;
    }
  };

  const testConnection = async (provider: AIProviderType): Promise<TestConnectionResult> => {
    try {
      const response = await window.electronAPI.testAIConnection(provider);

      if (response.success && response.data) {
        return response.data as TestConnectionResult;
      }

      return {
        available: false,
        latency: 0,
        error: 'error' in response ? response.error : 'Connection test failed',
      };
    } catch (err) {
      return {
        available: false,
        latency: 0,
        error: err instanceof Error ? err.message : 'Connection test failed',
      };
    }
  };

  const value: AIProviderContextValue = {
    config,
    isLoading,
    error,
    activeProvider: config?.activeProvider || null,
    isConfigured: !!(config?.openai?.hasApiKey || config?.ollama),
    refreshConfig,
    configureOpenAI,
    configureOllama,
    switchProvider,
    testConnection,
  };

  return (
    <AIProviderContext.Provider value={value}>
      {children}
    </AIProviderContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAIProvider(): AIProviderContextValue {
  const context = useContext(AIProviderContext);
  if (!context) {
    throw new Error('useAIProvider must be used within an AIProviderProvider');
  }
  return context;
}

export default AIProviderProvider;

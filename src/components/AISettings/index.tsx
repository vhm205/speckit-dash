/**
 * AI Settings Component
 * Main settings panel for configuring AI providers
 */

import { useState } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider, type AIProviderType } from '../../contexts/AIProviderContext';
import { useSettings } from '../../contexts/SettingsContext';
import OpenAIConfig from './OpenAIConfig';
import OllamaConfig from './OllamaConfig';
import OpenRouterConfig from './OpenRouterConfig';
import ConnectionTest from './ConnectionTest';

type SettingsTab = 'providers' | 'general';

export function AISettings() {
  const { config, activeProvider, isLoading, error, switchProvider } = useAIProvider();
  const { blurLevel, setBlurLevel } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('providers');
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>(() => activeProvider || 'openai');
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchProvider = async (provider: AIProviderType) => {
    if (provider === activeProvider) return;

    setIsSwitching(true);
    const success = await switchProvider(provider);
    setIsSwitching(false);

    if (success) {
      setSelectedProvider(provider);
    }
  };

  const getProviderLabel = (provider: AIProviderType): string => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'ollama':
        return 'Ollama (Local)';
      case 'openrouter':
        return 'OpenRouter';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Application Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage application preferences and AI provider configurations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'providers'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            AI Providers
          </button>
          {/* <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            General
          </button> */}
        </nav>
      </div>

      {/* Error display */}
      {error && activeTab === 'providers' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'general' ? (
          <div className="space-y-6">
            <Card>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        Background Blur
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-mono">
                          {blurLevel}px
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Adjust the intensity of the glassmorphic background effect
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">0px</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={blurLevel}
                      onChange={(e) => setBlurLevel(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <span className="text-xs text-gray-400">20px</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <>
            {/* Provider Selection */}
            <Card className="mb-6">
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select AI Provider
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Choose which AI provider to configure and use for analysis
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value as AIProviderType)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="ollama">Ollama (Local)</option>
                        <option value="openrouter">OpenRouter</option>
                      </select>
                    </div>

                    {activeProvider && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Active:</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                          {getProviderLabel(activeProvider)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Switch Provider Button */}
                  {selectedProvider !== activeProvider && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        onClick={() => handleSwitchProvider(selectedProvider)}
                        disabled={isSwitching}
                      >
                        {isSwitching ? 'Switching...' : `Switch to ${getProviderLabel(selectedProvider)}`}
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        All AI analysis will use this provider after switching
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Provider Configuration */}
            {selectedProvider === 'openai' && (
              <OpenAIConfig
                isActive={activeProvider === 'openai'}
                config={config?.openai}
              />
            )}

            {selectedProvider === 'ollama' && (
              <OllamaConfig
                isActive={activeProvider === 'ollama'}
                config={config?.ollama}
              />
            )}

            {selectedProvider === 'openrouter' && (
              <OpenRouterConfig
                isActive={activeProvider === 'openrouter'}
                config={config?.openrouter}
              />
            )}

            {/* Connection Test */}
            <div className="mt-6">
              <ConnectionTest provider={selectedProvider} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AISettings;

/**
 * AI Settings Component
 * Main settings panel for configuring AI providers
 */

import { useState } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider, type AIProviderType } from '../../contexts/AIProviderContext';
import OpenAIConfig from './OpenAIConfig';
import OllamaConfig from './OllamaConfig';
import ConnectionTest from './ConnectionTest';

type SettingsTab = 'openai' | 'ollama';

export function AISettings() {
  const { config, activeProvider, isLoading, error, switchProvider } = useAIProvider();
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    activeProvider || 'openai'
  );
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchProvider = async (provider: AIProviderType) => {
    if (provider === activeProvider) return;

    setIsSwitching(true);
    await switchProvider(provider);
    setIsSwitching(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading AI settings...</p>
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
          AI Provider Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure AI providers for document analysis and insights
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Active Provider Badge */}
      {activeProvider && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
            {activeProvider === 'openai' ? 'OpenAI' : 'Ollama'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('openai')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'openai'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            OpenAI
          </button>
          <button
            onClick={() => setActiveTab('ollama')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ollama'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            Ollama (Local)
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'openai' ? (
          <OpenAIConfig
            isActive={activeProvider === 'openai'}
            config={config?.openai}
          />
        ) : (
          <OllamaConfig
            isActive={activeProvider === 'ollama'}
            config={config?.ollama}
          />
        )}
      </div>

      {/* Connection Test */}
      <ConnectionTest provider={activeTab} />

      {/* Switch Provider Button */}
      {activeTab !== activeProvider && (
        <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Switch to {activeTab === 'openai' ? 'OpenAI' : 'Ollama'}?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All AI analysis will use this provider
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleSwitchProvider(activeTab)}
                disabled={isSwitching}
              >
                {isSwitching ? 'Switching...' : 'Switch Provider'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default AISettings;

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
import ConnectionTest from './ConnectionTest';

type SettingsTab = 'openai' | 'ollama' | 'general';

export function AISettings() {
  const { config, activeProvider, isLoading, error, switchProvider } = useAIProvider();
  const { blurLevel, setBlurLevel } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
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
            onClick={() => setActiveTab('general')}
            className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
          >
            General
          </button>
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

      {/* Error display */}
      {error && activeTab !== 'general' && (
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
            {/* Active Provider Badge */}
            {activeProvider && (
              <div className="mb-6 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                  {activeProvider === 'openai' ? 'OpenAI' : 'Ollama'}
                </span>
              </div>
            )}

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

            <div className="mt-6">
              <ConnectionTest provider={activeTab as AIProviderType} />
            </div>
          </>
        )}
      </div>


      {/* Switch Provider Button */}
      {activeTab !== 'general' && activeTab !== activeProvider && (
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
                onClick={() => handleSwitchProvider(activeTab as AIProviderType)}
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

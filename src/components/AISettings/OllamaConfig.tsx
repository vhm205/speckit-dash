/**
 * Ollama Configuration Component
 * Form for configuring local Ollama settings
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider } from '../../contexts/AIProviderContext';

interface SafeOllamaConfig {
  baseURL: string;
  model: string;
  isRunning: boolean;
}

interface OllamaConfigProps {
  isActive: boolean;
  config?: SafeOllamaConfig;
}

const DEFAULT_OLLAMA_MODELS = [
  { id: 'llama3.2', name: 'Llama 3.2 (7B)' },
  { id: 'llama3.1', name: 'Llama 3.1 (8B)' },
  { id: 'mistral', name: 'Mistral (7B)' },
  { id: 'codellama', name: 'CodeLlama (7B)' },
  { id: 'gemma2', name: 'Gemma 2 (9B)' },
];

export function OllamaConfig({ isActive, config }: OllamaConfigProps) {
  const { configureOllama, testConnection } = useAIProvider();

  const [baseURL, setBaseURL] = useState(config?.baseURL || 'http://localhost:11434');
  const [model, setModel] = useState(config?.model || 'llama3.2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(config?.isRunning || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    setIsChecking(true);
    const result = await testConnection('ollama');
    setIsRunning(result.available);
    if (result.models) {
      setAvailableModels(result.models);
    }
    setIsChecking(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const success = await configureOllama(baseURL, model);

    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save configuration');
    }
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Ollama Configuration
          </h3>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                Active
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isRunning
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
            >
              {isChecking ? 'Checking...' : isRunning ? 'Running' : 'Not Running'}
            </span>
          </div>
        </div>

        {/* Status Info */}
        {!isRunning && !isChecking && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Ollama is not running
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                  Start Ollama to use local AI models.{' '}
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Download Ollama
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base URL
          </label>
          <input
            type="url"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Default: http://localhost:11434
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            {availableModels.length > 0 ? (
              availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))
            ) : (
              DEFAULT_OLLAMA_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </select>
          {availableModels.length > 0 && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ {availableModels.length} models found on your system
            </p>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={checkOllamaStatus}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Refresh Status'}
        </Button>

        {/* Error/Success Messages */}
        {saveError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm">
              Configuration saved successfully!
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !isRunning}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default OllamaConfig;

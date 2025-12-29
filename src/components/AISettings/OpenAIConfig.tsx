/**
 * OpenAI Configuration Component
 * Form for configuring OpenAI API settings
 */

import { useState } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider } from '../../contexts/AIProviderContext';

interface SafeOpenAIConfig {
  model: string;
  baseURL: string;
  hasApiKey: boolean;
}

interface OpenAIConfigProps {
  isActive: boolean;
  config?: SafeOpenAIConfig;
}

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Recommended)' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Faster)' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Budget)' },
];

export function OpenAIConfig({ isActive, config }: OpenAIConfigProps) {
  const { configureOpenAI } = useAIProvider();

  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(config?.model || 'gpt-4o');
  const [baseURL, setBaseURL] = useState(config?.baseURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!apiKey && !config?.hasApiKey) {
      setSaveError('API key is required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Use existing key if not provided
    const keyToUse = apiKey || '__EXISTING_KEY__';

    const success = await configureOpenAI(
      keyToUse,
      model,
      baseURL || undefined
    );

    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      setApiKey(''); // Clear input after save
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
            OpenAI Configuration
          </h3>
          {isActive && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              Active
            </span>
          )}
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.hasApiKey ? '••••••••••••••••' : 'sk-...'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your API key is encrypted and stored securely.{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline"
            >
              Get an API key
            </a>
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
            {OPENAI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Base URL (Advanced) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base URL <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="url"
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            For Azure OpenAI or custom endpoints
          </p>
        </div>

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
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default OpenAIConfig;

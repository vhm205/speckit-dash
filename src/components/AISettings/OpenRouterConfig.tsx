/**
 * OpenRouter Configuration Component
 * Form for configuring OpenRouter API settings
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider } from '../../contexts/AIProviderContext';

interface SafeOpenRouterConfig {
    model: string;
    hasApiKey: boolean;
    siteUrl?: string;
    appName?: string;
}

interface OpenRouterConfigProps {
    isActive: boolean;
    config?: SafeOpenRouterConfig;
}

export function OpenRouterConfig({ isActive, config }: OpenRouterConfigProps) {
    const { configureOpenRouter, testConnection } = useAIProvider();

    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState(config?.model || '');
    const [siteUrl, setSiteUrl] = useState(config?.siteUrl || 'https://speckit.dev');
    const [appName, setAppName] = useState(config?.appName || 'Speckit Dashboard');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const loadModels = useCallback(async () => {
        // Only load if API key is already configured (saved)
        if (!config?.hasApiKey) {
            setSaveError('Please save your API key first before fetching models');
            return;
        }

        setIsLoadingModels(true);
        setSaveError(null);
        try {
            const result = await testConnection('openrouter');
            if (result.models && result.models.length > 0) {
                setAvailableModels(result.models);
                if (!model && result.models.length > 0) {
                    setModel(result.models[0]);
                }
            } else if (result.error) {
                setSaveError(`Failed to load models: ${result.error}`);
            }
        } catch (error) {
            console.error('Failed to load OpenRouter models:', error);
            setSaveError('Failed to load models. Please check your API key and try again.');
        } finally {
            setIsLoadingModels(false);
        }
    }, [config?.hasApiKey, testConnection, model]);

    // Load models when component mounts if API key is configured
    useEffect(() => {
        if (config?.hasApiKey) {
            loadModels();
        }
    }, [config?.hasApiKey, loadModels]);

    // Initialize Preline select after models are loaded
    useEffect(() => {
        if (availableModels.length > 0 && window.HSStaticMethods) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                window.HSStaticMethods.autoInit();
            }, 100);
        }
    }, [availableModels]);

    const handleSave = async () => {
        if (!apiKey && !config?.hasApiKey) {
            setSaveError('API key is required');
            return;
        }

        if (!model) {
            setSaveError('Please select a model');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        // Use existing key if not provided
        const keyToUse = apiKey || '__EXISTING_KEY__';

        const success = await configureOpenRouter(
            keyToUse,
            model,
            siteUrl || undefined,
            appName || undefined
        );

        setIsSaving(false);

        if (success) {
            setSaveSuccess(true);
            setApiKey(''); // Clear input after save
            // Load models with new config
            setTimeout(() => loadModels(), 500);
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
                        OpenRouter Configuration
                    </h3>
                    {isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            Active
                        </span>
                    )}
                </div>

                {/* Info Banner */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        OpenRouter provides access to multiple AI models through a single API.{' '}
                        <a
                            href="https://openrouter.ai/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                        >
                            Get started with OpenRouter
                        </a>
                    </p>
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
                        placeholder={config?.hasApiKey ? '••••••••••••••••' : 'sk-or-v1-...'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Your API key is encrypted and stored securely.{' '}
                        <a
                            href="https://openrouter.ai/keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 dark:text-violet-400 hover:underline"
                        >
                            Get an API key
                        </a>
                    </p>
                </div>

                {/* Model Selection with Preline Advanced Select */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Model
                        </label>
                        {config?.hasApiKey && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={loadModels}
                                disabled={isLoadingModels}
                            >
                                {isLoadingModels ? 'Loading...' : 'Fetch Models'}
                            </Button>
                        )}
                    </div>
                    {availableModels.length > 0 ? (
                        <select
                            data-hs-select='{
                                "hasSearch": true,
                                "searchPlaceholder": "Search models...",
                                "searchClasses": "block w-full text-sm border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 before:absolute before:inset-0 before:z-[1] dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 py-2 px-3",
                                "searchWrapperClasses": "bg-white p-2 -mx-1 sticky top-0 dark:bg-neutral-900",
                                "placeholder": "Select a model...",
                                "toggleTag": "<button type=\"button\" aria-expanded=\"false\"></button>",
                                "toggleClasses": "hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50 relative py-2 ps-3 pe-9 flex gap-x-2 text-nowrap w-full cursor-pointer bg-white border border-gray-300 dark:border-gray-600 rounded-lg text-start text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-gray-800 dark:text-white",
                                "dropdownClasses": "mt-2 max-h-72 pb-1 px-1 space-y-0.5 z-50 w-full bg-white border border-gray-200 rounded-lg overflow-hidden overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 dark:bg-neutral-900 dark:border-neutral-700",
                                "optionClasses": "py-2 px-3 w-full text-sm text-gray-800 cursor-pointer hover:bg-gray-100 rounded-lg focus:outline-none focus:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-800",
                                "optionTemplate": "<div class=\"flex justify-between items-center w-full\"><span data-title></span><span class=\"hidden hs-selected:block\"><svg class=\"shrink-0 size-3.5 text-violet-600 dark:text-violet-500\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"20 6 9 17 4 12\"/></svg></span></div>",
                                "extraMarkup": "<div class=\"absolute top-1/2 end-2.5 -translate-y-1/2\"><svg class=\"shrink-0 size-3.5 text-gray-500 dark:text-neutral-500\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 15 5 5 5-5\"/><path d=\"m7 9 5-5 5 5\"/></svg></div>"
                            }'
                            className="hidden"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        >
                            <option value="">Select a model...</option>
                            {availableModels.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="e.g., openai/gpt-4-turbo"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {availableModels.length > 0
                            ? `✓ ${availableModels.length} models available`
                            : config?.hasApiKey
                                ? 'Click "Fetch Models" to load available models'
                                : 'Save your API key first, then fetch models'}
                    </p>
                </div>

                {/* Site URL (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Site URL <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                        type="url"
                        value={siteUrl}
                        onChange={(e) => setSiteUrl(e.target.value)}
                        placeholder="https://your-site.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        For ranking and analytics on OpenRouter
                    </p>
                </div>

                {/* App Name (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        App Name <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="Speckit Dashboard"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Displayed in OpenRouter analytics
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
                        disabled={isSaving || isLoadingModels}
                        className="w-full sm:w-auto"
                    >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}

export default OpenRouterConfig;

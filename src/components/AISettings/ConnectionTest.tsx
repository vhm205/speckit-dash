/**
 * Connection Test Component
 * Tests and displays connection status for AI providers
 */

import { useState } from 'react';
import { Card, CardBody, Button } from '../ui';
import { useAIProvider, type AIProviderType } from '../../contexts/AIProviderContext';

interface ConnectionTestProps {
  provider: AIProviderType;
}

export function ConnectionTest({ provider }: ConnectionTestProps) {
  const { testConnection } = useAIProvider();

  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    available: boolean;
    latency: number;
    models?: string[];
    error?: string;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setResult(null);

    const testResult = await testConnection(provider);
    setResult(testResult);
    setIsTesting(false);
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Connection Test
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Test connectivity to {provider === 'openai' ? 'OpenAI API' : 'Ollama'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {result.available ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-medium">Connection Failed</span>
                </div>
              )}
            </div>

            {result.available && (
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Latency:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {result.latency}ms
                  </span>
                </div>
                {result.models && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Models:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {result.models.length}
                    </span>
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {result.error}
              </p>
            )}

            {result.models && result.models.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Available models:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.models.slice(0, 5).map((model) => (
                    <span
                      key={model}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {model}
                    </span>
                  ))}
                  {result.models.length > 5 && (
                    <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      +{result.models.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default ConnectionTest;

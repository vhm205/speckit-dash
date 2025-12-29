/**
 * Summary View Component
 * Generates and displays AI-powered summaries of specification documents
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '../../components/ui';
import { useAIAnalysis, type SummaryResult } from '../../hooks/useAIAnalysis';

interface SummaryViewProps {
  featureId: number;
}

export function SummaryView({ featureId }: SummaryViewProps) {
  const { generateSummary, isLoading, error, clearError } = useAIAnalysis();
  const [selectedFile, setSelectedFile] = useState<string>('spec.md');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [specPath, setSpecPath] = useState<string | null>(null);

  // Load feature spec path
  useEffect(() => {
    async function loadFeature() {
      try {
        const response = await window.electronAPI.getFeature(featureId);
        if (response.success && response.data?.feature) {
          setSpecPath(response.data.feature.specPath);
        }
      } catch {
        // Handle error silently
      }
    }
    loadFeature();
  }, [featureId]);

  const handleGenerate = async () => {
    if (!specPath) return;

    const basePath = specPath.replace(/spec\.md$/, '');
    const filePath = basePath + selectedFile;

    const summaryResult = await generateSummary(featureId, filePath);
    if (summaryResult) {
      setResult(summaryResult);
    }
  };

  const files = [
    { id: 'spec.md', name: 'Specification (spec.md)' },
    { id: 'plan.md', name: 'Implementation Plan (plan.md)' },
    { id: 'tasks.md', name: 'Tasks (tasks.md)' },
    { id: 'data-model.md', name: 'Data Model (data-model.md)' },
  ];

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardBody>
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Generate Document Summary
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Document
              </label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              >
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isLoading || !specPath}
              >
                {isLoading ? 'Generating...' : 'Generate Summary'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-500 hover:text-red-600 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardBody className="py-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Analyzing document with AI...
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                This may take up to 10 seconds
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Summary Result
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{result.wordCount} words</span>
                <span>{result.duration}ms</span>
                {result.tokenCount && <span>{result.tokenCount} tokens</span>}
              </div>
            </div>

            {/* Summary Text */}
            <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {result.summary}
              </p>
            </div>

            {/* Key Points */}
            {result.keyPoints && result.keyPoints.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {result.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-600 dark:text-gray-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default SummaryView;

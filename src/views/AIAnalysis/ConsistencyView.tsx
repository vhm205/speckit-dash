/**
 * Consistency View Component
 * Checks consistency across specification documents
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '../../components/ui';
import { useAIAnalysis, type ConsistencyResult, type Discrepancy } from '../../hooks/useAIAnalysis';

interface ConsistencyViewProps {
  featureId: number;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  low: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
};

export function ConsistencyView({ featureId }: ConsistencyViewProps) {
  const { checkConsistency, isLoading, error, clearError } = useAIAnalysis();
  const [selectedFiles, setSelectedFiles] = useState<string[]>(['spec.md', 'plan.md', 'tasks.md']);
  const [result, setResult] = useState<ConsistencyResult | null>(null);
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

  const handleCheck = async () => {
    if (!specPath || selectedFiles.length < 2) return;

    const basePath = specPath.replace(/spec\.md$/, '');
    const filePaths = selectedFiles.map((f) => basePath + f);

    const checkResult = await checkConsistency(featureId, filePaths);
    if (checkResult) {
      setResult(checkResult);
    }
  };

  const toggleFile = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const files = [
    { id: 'spec.md', name: 'Specification' },
    { id: 'plan.md', name: 'Plan' },
    { id: 'tasks.md', name: 'Tasks' },
    { id: 'data-model.md', name: 'Data Model' },
  ];

  const renderDiscrepancy = (disc: Discrepancy, index: number) => {
    const colors = SEVERITY_COLORS[disc.severity] || SEVERITY_COLORS.medium;

    return (
      <div
        key={index}
        className={`p-4 rounded-lg border ${colors.bg} border-opacity-50`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${colors.text} ${colors.bg}`}
            >
              {disc.severity.toUpperCase()}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400`}
            >
              {disc.type}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {disc.file1} ↔ {disc.file2}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
          {disc.section}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {disc.description}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardBody>
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Check Document Consistency
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Documents to Compare (at least 2)
            </label>
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => toggleFile(file.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFiles.includes(file.id)
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {file.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleCheck}
            disabled={isLoading || !specPath || selectedFiles.length < 2}
          >
            {isLoading ? 'Analyzing...' : 'Check Consistency'}
          </Button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button onClick={clearError} className="mt-2 text-sm text-red-500 hover:text-red-600 underline">
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
                Checking consistency across documents...
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <>
          {/* Consistency Score */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Overall Consistency
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Analyzed: {result.filesAnalyzed.join(', ')}
                  </p>
                </div>
                <div
                  className={`text-3xl font-bold ${result.overallConsistency >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : result.overallConsistency >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                >
                  {result.overallConsistency}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${result.overallConsistency >= 80
                      ? 'bg-green-500'
                      : result.overallConsistency >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  style={{ width: `${result.overallConsistency}%` }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Discrepancies */}
          <Card>
            <CardBody>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Discrepancies Found ({result.discrepancies.length})
              </h3>

              {result.discrepancies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No discrepancies found! Documents are consistent.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.discrepancies.map((disc, index) => renderDiscrepancy(disc, index))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

export default ConsistencyView;

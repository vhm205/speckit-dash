/**
 * Gap Analysis View Component
 * Identifies gaps and missing elements in specification documents
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '../../components/ui';
import { useAIAnalysis, type GapResult, type Gap } from '../../hooks/useAIAnalysis';

interface GapAnalysisViewProps {
  featureId: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: '🚨',
  },
  important: {
    bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: '⚠️',
  },
  minor: {
    bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '💡',
  },
};

export function GapAnalysisView({ featureId }: GapAnalysisViewProps) {
  const { findGaps, isLoading, error, clearError } = useAIAnalysis();
  const [selectedFile, setSelectedFile] = useState<string>('spec.md');
  const [result, setResult] = useState<GapResult | null>(null);
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

  const handleAnalyze = async () => {
    if (!specPath) return;

    const basePath = specPath.replace(/spec\.md$/, '');
    const filePath = basePath + selectedFile;

    const gapResult = await findGaps(featureId, filePath);
    if (gapResult) {
      setResult(gapResult);
    }
  };

  const files = [
    { id: 'spec.md', name: 'Specification (spec.md)' },
    { id: 'plan.md', name: 'Implementation Plan (plan.md)' },
    { id: 'tasks.md', name: 'Tasks (tasks.md)' },
  ];

  const renderGap = (gap: Gap, index: number) => {
    const style = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.minor;

    return (
      <div key={index} className={`p-4 rounded-lg border ${style.bg}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0">{style.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${style.text}`}>{gap.section}</span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${style.text} ${style.bg}`}
              >
                {gap.severity}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {gap.issue}
            </p>
            <div className="bg-white/50 dark:bg-gray-900/50 rounded p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Suggestion: </span>
                {gap.suggestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardBody>
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Analyze Document Gaps
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
                onClick={handleAnalyze}
                disabled={isLoading || !specPath}
              >
                {isLoading ? 'Analyzing...' : 'Find Gaps'}
              </Button>
            </div>
          </div>

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
                Analyzing document for gaps...
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Result Display */}
      {result && !isLoading && (
        <>
          {/* Completeness Score */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Document Completeness
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sections analyzed: {result.sectionsAnalyzed.length}
                  </p>
                </div>
                <div
                  className={`text-3xl font-bold ${result.completeness >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : result.completeness >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                >
                  {result.completeness}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${result.completeness >= 80
                      ? 'bg-green-500'
                      : result.completeness >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  style={{ width: `${result.completeness}%` }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Gaps List */}
          <Card>
            <CardBody>
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Identified Gaps ({result.gaps.length})
              </h3>

              {result.gaps.length === 0 ? (
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
                    No gaps found! Document appears complete.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.gaps.map((gap, index) => renderGap(gap, index))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

export default GapAnalysisView;

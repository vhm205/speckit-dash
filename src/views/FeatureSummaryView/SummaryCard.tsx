/**
 * Speckit Dashboard - Summary Card Component
 * Displays AI-generated summary for a single document
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, Button } from '../../components/ui';
import { useAIAnalysis, type SummaryResult } from '../../hooks/useAIAnalysis';
import MarkdownContentModal from '../../components/MarkdownContentModal';

export interface DocumentType {
  id: string;
  name: string;
  filename: string;
  icon: JSX.Element;
  color: string;
}

interface SummaryCardProps {
  featureId: number;
  documentType: DocumentType;
  filePath: string;
}

const colorClasses = {
  blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
  emerald: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
  purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10',
};

const iconColorClasses = {
  blue: 'text-blue-600 dark:text-blue-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  purple: 'text-purple-600 dark:text-purple-400',
};

export function SummaryCard({ featureId, documentType, filePath }: SummaryCardProps) {
  const { generateSummary, isLoading, error, clearError } = useAIAnalysis();
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load cached summary on mount
  useEffect(() => {
    const loadCached = async () => {
      const cachedResult = await generateSummary(featureId, filePath, false);
      if (cachedResult) {
        setResult(cachedResult);
        setFileExists(true);
      }
    };
    loadCached();
  }, [featureId, filePath, generateSummary]);

  const handleGenerate = async () => {
    // If result already exists, we are regenerating
    const isRegenerating = !!result;
    const summaryResult = await generateSummary(featureId, filePath, isRegenerating);
    if (summaryResult) {
      setResult(summaryResult);
      setFileExists(true);
    } else if (error) {
      // File might not exist
      setFileExists(false);
    }
  };

  const colorClass = colorClasses[documentType.color as keyof typeof colorClasses];
  const iconColorClass = iconColorClasses[documentType.color as keyof typeof iconColorClasses];

  return (
    <>
      <Card className={`border-2 ${colorClass}`}>
        <CardBody>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={iconColorClass}>
                {documentType.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {documentType.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {documentType.filename}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                onClick={() => setIsModalOpen(true)}
              >
                View Content
              </Button>
              <Button
                size="sm"
                variant="flat"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : result ? (
                  'Regenerate'
                ) : (
                  'Generate Summary'
                )}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-500 hover:text-red-600 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* File Not Found State */}
          {fileExists === false && !isLoading && (
            <div className="py-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">
                No {documentType.filename} file found for this feature
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  Analyzing document with AI...
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  This may take up to 10 seconds
                </p>
              </div>
            </div>
          )}

          {/* Summary Result */}
          {result && !isLoading && (
            <div>
              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <span>{result.wordCount} words</span>
                <span>{result.duration}ms</span>
                {result.tokenCount && <span>{result.tokenCount} tokens</span>}
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
                        <span className={`w-5 h-5 rounded-full ${colorClass} ${iconColorClass} flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-semibold`}>
                          {index + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !isLoading && !error && fileExists === null && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Click "Generate Summary" to create an AI-powered summary of this document
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <MarkdownContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureId={featureId}
        fileType={documentType.id as any}
        fileName={documentType.filename}
      />
    </>
  );
}

export default SummaryCard;

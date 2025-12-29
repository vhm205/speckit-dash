/**
 * Analysis History Component
 * Displays past analysis results for a feature
 */

import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui';
import { useAIAnalysis, type AnalysisRecord } from '../../hooks/useAIAnalysis';

interface AnalysisHistoryProps {
  featureId: number;
}

const ANALYSIS_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  summary: { label: 'Summary', icon: '📝' },
  consistency: { label: 'Consistency', icon: '🔍' },
  gaps: { label: 'Gap Analysis', icon: '📊' },
};

export function AnalysisHistory({ featureId }: AnalysisHistoryProps) {
  const { getHistory } = useAIAnalysis();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      const history = await getHistory(featureId, filter === 'all' ? undefined : filter, 20);
      setRecords(history);
      setIsLoading(false);
    }
    loadHistory();
  }, [featureId, filter, getHistory]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Analysis History
            </h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="summary">Summaries</option>
              <option value="consistency">Consistency</option>
              <option value="gaps">Gap Analysis</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardBody className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && records.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              No Analysis History
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Run some analyses to see them here
            </p>
          </CardBody>
        </Card>
      )}

      {/* History List */}
      {!isLoading && records.length > 0 && (
        <div className="space-y-3">
          {records.map((record) => {
            const typeInfo = ANALYSIS_TYPE_LABELS[record.analysisType] || {
              label: record.analysisType,
              icon: '📄',
            };

            return (
              <Card key={record.requestId} className="hover:shadow-md transition-shadow">
                <CardBody className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{typeInfo.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {typeInfo.label}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(record.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {record.preview}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>⏱ {formatDuration(record.duration)}</span>
                        {record.tokenCount && <span>🔢 {record.tokenCount} tokens</span>}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AnalysisHistory;

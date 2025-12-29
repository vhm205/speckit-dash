/**
 * AI Analysis Main View
 * Dashboard for AI-powered document analysis features
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardBody, Button } from '../../components/ui';
import { useAIProvider } from '../../contexts/AIProviderContext';
import SummaryView from './SummaryView';
import ConsistencyView from './ConsistencyView';
import GapAnalysisView from './GapAnalysisView';
import AnalysisHistory from './AnalysisHistory';

type AnalysisTab = 'summary' | 'consistency' | 'gaps' | 'history';

export function AIAnalysis() {
  const { featureId } = useParams<{ featureId: string }>();
  const { isConfigured, activeProvider } = useAIProvider();
  const [activeTab, setActiveTab] = useState<AnalysisTab>('summary');

  const numericFeatureId = featureId ? parseInt(featureId, 10) : null;

  if (!numericFeatureId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardBody className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Select a feature to analyze
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Analysis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            AI-powered insights for your specifications
          </p>
        </div>

        <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
          <CardBody className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-violet-600 dark:text-violet-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Configure AI Provider
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Set up OpenAI or Ollama to enable AI-powered analysis of your
                specification documents.
              </p>
              <Button variant="primary" onClick={() => window.location.href = '/settings/ai'}>
                Go to AI Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Analysis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Powered by {activeProvider === 'openai' ? 'OpenAI' : 'Ollama'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6" aria-label="Analysis Tabs">
          {[
            { id: 'summary' as const, label: 'Summary', icon: '📝' },
            { id: 'consistency' as const, label: 'Consistency', icon: '🔍' },
            { id: 'gaps' as const, label: 'Gap Analysis', icon: '📊' },
            { id: 'history' as const, label: 'History', icon: '📜' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'summary' && <SummaryView featureId={numericFeatureId} />}
        {activeTab === 'consistency' && <ConsistencyView featureId={numericFeatureId} />}
        {activeTab === 'gaps' && <GapAnalysisView featureId={numericFeatureId} />}
        {activeTab === 'history' && <AnalysisHistory featureId={numericFeatureId} />}
      </div>
    </div>
  );
}

export default AIAnalysis;

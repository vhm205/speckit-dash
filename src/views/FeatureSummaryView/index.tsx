/**
 * Speckit Dashboard - Feature Summary View
 * AI-powered summaries for spec, requirements, and plan documents
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SummaryCard } from './SummaryCard';
import type { Feature } from '../../types';

interface DocumentType {
  id: string;
  name: string;
  filename: string;
  icon: JSX.Element;
  color: string;
}

const documents: DocumentType[] = [
  {
    id: 'spec',
    name: 'Specification',
    filename: 'spec.md',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    id: 'requirements',
    name: 'Requirements',
    filename: 'checklists/requirements.md',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    id: 'plan',
    name: 'Implementation Plan',
    filename: 'plan.md',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: 'purple',
  },
];

export function FeatureSummaryView() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeature() {
      if (!featureId) {
        setIsLoading(false);
        setError('No feature ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.getFeature(Number(featureId));
        if (response.success && response.data) {
          setFeature(response.data.feature);
        } else if (!response.success) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeature();
  }, [featureId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading feature..." />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md bg-red-50 dark:bg-red-900/20">
          <CardBody className="text-center py-8">
            <p className="text-red-500 mb-4">{error || 'Feature not found'}</p>
            <Button onPress={() => navigate('/features')}>Back to Features</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Construct file paths from spec path
  const basePath = feature.specPath.replace(/spec\.md$/, '');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={() => navigate('/features')}
          aria-label="Back to features"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {feature.featureNumber}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {feature.title || feature.featureName} - AI Summaries
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/kanban`)}
          >
            View Kanban
          </Button>
          <Button
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/gantt`)}
          >
            View Timeline
          </Button>
          <Button
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/architecture`)}
          >
            View Architecture
          </Button>
          <Button
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/schema`)}
          >
            View Schema
          </Button>
          <Button
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/ai-analysis`)}
            className="text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800"
          >
            AI Analysis
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-6">
        {documents.map((doc) => (
          <SummaryCard
            key={doc.id}
            featureId={Number(featureId)}
            documentType={doc}
            filePath={basePath + doc.filename}
          />
        ))}
      </div>
    </div>
  );
}

export default FeatureSummaryView;

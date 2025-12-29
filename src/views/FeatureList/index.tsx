/**
 * Speckit Dashboard - Feature List View
 * List of all features with click-through to Kanban
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui';
import { useProject } from '../../contexts/ProjectContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import FeatureCard from '../../components/FeatureCard';
import type { Feature } from '../../types';

export function FeatureList() {
  const { activeProject } = useProject();
  const navigate = useNavigate();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFeatures() {
      if (!activeProject) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.listFeatures(activeProject.id);
        if (response.success && response.data) {
          setFeatures(response.data.features);
        } else if (!response.success) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load features');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeatures();
  }, [activeProject]);

  const handleFeatureClick = (feature: Feature) => {
    navigate(`/features/${feature.id}/kanban`);
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardBody className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Select a project to view features.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading features..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md bg-red-50 dark:bg-red-900/20">
          <CardBody className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Features</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {features.length} feature{features.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      {features.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Features Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No feature specifications found in this project.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onClick={() => handleFeatureClick(feature)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FeatureList;

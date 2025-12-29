/**
 * Speckit Dashboard - Stats Overview View
 * Main dashboard landing page with project health metrics
 */

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../components/ui';
import { useProject } from '../../contexts/ProjectContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import FeatureStatusChart from './FeatureStatusChart';
import TaskProgressChart from './TaskProgressChart';
import ProjectHealthCard from './ProjectHealthCard';
import type { ProjectStats } from '../../types';

export function StatsOverview() {
  const { activeProject } = useProject();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      if (!activeProject) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.getStatsOverview(activeProject.id);
        if (response.success && response.data) {
          setStats(response.data.stats);
        } else if (!response.success) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardBody className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Project Selected</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Configure a Spec-kit project to view dashboard statistics.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading project statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md bg-red-50 dark:bg-red-900/20">
          <CardBody className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Stats</h3>
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Project Overview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {activeProject.name} - {activeProject.rootPath}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProjectHealthCard
          title="Total Features"
          value={stats?.totalFeatures ?? 0}
          icon="features"
          trend={null}
        />
        <ProjectHealthCard
          title="Total Tasks"
          value={stats?.totalTasks ?? 0}
          icon="tasks"
          trend={null}
        />
        <ProjectHealthCard
          title="Task Completion"
          value={`${Math.round(stats?.avgTaskCompletion ?? 0)}%`}
          icon="progress"
          trend={null}
        />
        <ProjectHealthCard
          title="Completed Features"
          value={stats?.featuresByStatus.complete ?? 0}
          icon="complete"
          trend={null}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Status Chart */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">Feature Status</h2>
          </CardHeader>
          <CardBody>
            {stats && <FeatureStatusChart data={stats.featuresByStatus} />}
          </CardBody>
        </Card>

        {/* Task Progress Chart */}
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">Task Progress</h2>
          </CardHeader>
          <CardBody>
            {stats && <TaskProgressChart data={stats.tasksByStatus} />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default StatsOverview;

/**
 * Speckit Dashboard - Kanban Board View
 * Task board with status columns for a specific feature
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/ui';
import { Button } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import KanbanColumn from './KanbanColumn';
import PhaseHeader from './PhaseHeader';
import type { Feature, Task } from '../../types';

export function KanbanBoard() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());

  // Group tasks by phase, then by status within each phase
  const tasksByPhase = useMemo(() => {
    const phases = new Map<string, { notStarted: Task[]; inProgress: Task[]; done: Task[] }>();

    tasks.forEach((task) => {
      const phase = task.phase || 'Unassigned';
      if (!phases.has(phase)) {
        phases.set(phase, { notStarted: [], inProgress: [], done: [] });
      }

      const phaseGroup = phases.get(phase)!;
      switch (task.status) {
        case 'not_started':
          phaseGroup.notStarted.push(task);
          break;
        case 'in_progress':
          phaseGroup.inProgress.push(task);
          break;
        case 'done':
          phaseGroup.done.push(task);
          break;
      }
    });

    // Sort phases by order
    return Array.from(phases.entries()).sort((a, b) => {
      const aTask = tasks.find((t) => t.phase === a[0]);
      const bTask = tasks.find((t) => t.phase === b[0]);
      return (aTask?.phaseOrder ?? 999) - (bTask?.phaseOrder ?? 999);
    });
  }, [tasks]);

  useEffect(() => {
    async function loadFeatureData() {
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
          setTasks(response.data.tasks);

          // Default all phases to collapsed
          const phaseNames = new Set(
            response.data.tasks.map(t => t.phase || 'Unassigned')
          );
          setCollapsedPhases(phaseNames);
        } else if (!response.success) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeatureData();
  }, [featureId]);

  const togglePhase = (phase: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedPhases(new Set());
  const collapseAll = () => {
    const allPhases = tasksByPhase.map(([phase]) => phase);
    setCollapsedPhases(new Set(allPhases));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading tasks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md bg-red-50 dark:bg-red-900/20">
          <CardBody className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onPress={() => navigate('/features')}>Back to Features</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardBody className="text-center py-8">
            <p className="text-gray-500">Feature not found</p>
            <Button className="mt-4" onPress={() => navigate('/features')}>
              Back to Features
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
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
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {feature.featureNumber}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {feature.title || feature.featureName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/summary`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">View Summary</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/gantt`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">View Timeline</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/architecture`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span className="hidden sm:inline">View Architecture</span>
          </Button>
          <Button size="sm" variant="flat" onPress={expandAll}>
            Expand All
          </Button>
          <Button size="sm" variant="flat" onPress={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {tasksByPhase.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found for this feature</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasksByPhase.map(([phase, tasksGroup]) => {
            const isCollapsed = collapsedPhases.has(phase);

            return (
              <div key={phase} className="space-y-4">
                <PhaseHeader
                  name={phase}
                  isCollapsed={isCollapsed}
                  onToggle={() => togglePhase(phase)}
                />

                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <KanbanColumn
                      title="Not Started"
                      tasks={tasksGroup.notStarted}
                      color="gray"
                    />
                    <KanbanColumn
                      title="In Progress"
                      tasks={tasksGroup.inProgress}
                      color="amber"
                    />
                    <KanbanColumn
                      title="Done"
                      tasks={tasksGroup.done}
                      color="emerald"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default KanbanBoard;

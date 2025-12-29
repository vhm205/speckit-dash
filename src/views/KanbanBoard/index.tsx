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

      {/* Kanban Board */}
      {tasksByPhase.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found for this feature</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-8">
          {tasksByPhase.map(([phase, tasksGroup]) => (
            <div key={phase} className="space-y-4">
              <PhaseHeader name={phase} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default KanbanBoard;

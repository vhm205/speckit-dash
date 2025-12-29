/**
 * Speckit Dashboard - Gantt Timeline View
 * Visualize task phases as a timeline
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Chip, Progress } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import GanttTask from './GanttTask';
import type { Feature, Task } from '../../types';

interface PhaseData {
  name: string;
  order: number;
  tasks: Task[];
  progress: number;
}

export function GanttTimeline() {
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

  // Group tasks by phase with progress calculation
  const phases = useMemo((): PhaseData[] => {
    const phaseMap = new Map<string, PhaseData>();

    tasks.forEach((task) => {
      const phaseName = task.phase || 'Unassigned';

      if (!phaseMap.has(phaseName)) {
        phaseMap.set(phaseName, {
          name: phaseName,
          order: task.phaseOrder || 999,
          tasks: [],
          progress: 0,
        });
      }

      phaseMap.get(phaseName)!.tasks.push(task);
    });

    // Calculate progress for each phase
    phaseMap.forEach((phase) => {
      const done = phase.tasks.filter((t) => t.status === 'done').length;
      phase.progress = (done / phase.tasks.length) * 100;
    });

    return Array.from(phaseMap.values()).sort((a, b) => a.order - b.order);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading timeline..." />
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
            {feature.title || feature.featureName} - Timeline
          </h1>
        </div>
        <Button
          variant="flat"
          onPress={() => navigate(`/features/${featureId}/kanban`)}
        >
          View Kanban
        </Button>
      </div>

      {/* Timeline Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
          <span className="text-gray-600 dark:text-gray-400">Not Started</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-gray-600 dark:text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-gray-600 dark:text-gray-400">Done</span>
        </div>
      </div>

      {/* Timeline */}
      {phases.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found for this feature</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <Card key={phase.name} className="overflow-hidden">
              <CardBody className="p-0">
                {/* Phase Header */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Chip size="sm" variant="flat" color="primary">
                        Phase {index + 1}
                      </Chip>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {phase.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {phase.tasks.filter((t) => t.status === 'done').length}/{phase.tasks.length} tasks
                      </span>
                      <div className="w-24">
                        <Progress
                          value={phase.progress}
                          size="sm"
                          color={phase.progress === 100 ? 'success' : 'primary'}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task bars */}
                <div className="p-4 space-y-2">
                  {phase.tasks.map((task) => (
                    <GanttTask key={task.id} task={task} />
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default GanttTimeline;

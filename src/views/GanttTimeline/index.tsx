/**
 * Speckit Dashboard - Gantt Timeline View
 * Visualize task phases as a timeline with plan data and dependencies
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Chip, Progress } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import GanttTask from './GanttTask';
import DependencyArrow, { DependencyArrowDefs } from './DependencyArrow';
import type { Feature, Task, Plan } from '../../types';

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
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);

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
          setPlan(response.data.plan);
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

  // Collect all task dependencies for rendering
  const dependencies = useMemo(() => {
    const deps: Array<{ from: string; to: string }> = [];
    tasks.forEach((task) => {
      if (task.dependencies && task.dependencies.length > 0) {
        task.dependencies.forEach((depId) => {
          deps.push({ from: depId, to: task.taskId });
        });
      }
    });
    return deps;
  }, [tasks]);

  // Merge plan phases with task data for enhanced visualization
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

    // Merge with plan phase goals if available
    const result = Array.from(phaseMap.values()).sort((a, b) => a.order - b.order);

    if (plan && plan.phases) {
      result.forEach((phase) => {
        const planPhase = plan.phases.find(p =>
          p.name.toLowerCase().includes(phase.name.toLowerCase()) ||
          phase.name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (planPhase && planPhase.goal) {
          phase.name = planPhase.name;
        }
      });
    }

    return result;
  }, [tasks, plan]);

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

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="space-y-6" ref={timelineRef} data-gantt-timeline>
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
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={handleZoomOut}
              aria-label="Zoom out"
              isDisabled={scale <= 0.5}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </Button>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={handleZoomIn}
              aria-label="Zoom in"
              isDisabled={scale >= 2}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={handleResetZoom}
              aria-label="Reset zoom"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>

          <Button
            variant="flat"
            size="sm"
            onPress={() => navigate(`/features/${featureId}/summary`)}
          >
            View Summary
          </Button>

          <Button
            variant="flat"
            size="sm"
            onPress={() => navigate(`/features/${featureId}/kanban`)}
          >
            View Kanban
          </Button>
        </div>
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

      {/* Plan Summary */}
      {plan && plan.summary && (
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardBody className="py-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Plan Summary:</span> {plan.summary}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Timeline */}
      {phases.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No tasks found for this feature</p>
          </CardBody>
        </Card>
      ) : (
        <div className="relative space-y-4" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
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
                <div className="p-4 space-y-2 relative">
                  {phase.tasks.map((task) => (
                    <GanttTask key={task.id} task={task} />
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}

          {/* SVG Overlay for Dependencies */}
          {dependencies.length > 0 && (
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <DependencyArrowDefs />
              {dependencies.map((dep, idx) => (
                <DependencyArrow
                  key={`${dep.from}-${dep.to}-${idx}`}
                  fromTaskId={dep.from}
                  toTaskId={dep.to}
                />
              ))}
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttTimeline;

/**
 * Speckit Dashboard - Gantt Task Component
 * Individual task bar in Gantt timeline
 */

import { Chip } from '../../components/ui';
import type { Task } from '../../types';

interface GanttTaskProps {
  task: Task;
}

const statusColors = {
  not_started: 'bg-gray-200 dark:bg-gray-700',
  in_progress: 'bg-amber-400',
  done: 'bg-success-500',
};

const statusTextColors = {
  not_started: 'text-gray-600 dark:text-gray-300',
  in_progress: 'text-amber-900',
  done: 'text-white',
};

export function GanttTask({ task }: GanttTaskProps) {
  const hasDependencies = task.dependencies && task.dependencies.length > 0;

  return (
    <div className="flex items-stretch gap-3 group" data-task-id={task.taskId}>
      {/* Task ID */}
      <div className="w-16 flex-shrink-0 flex items-center">
        <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
          {task.taskId}
        </span>
      </div>

      {/* Task Bar */}
      <div
        className={`flex-1 px-3 py-2 rounded-lg ${statusColors[task.status]} ${statusTextColors[task.status]} transition-all group-hover:shadow-md group-hover:shadow-primary-500/20`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-medium truncate">
              {task.description}
            </span>
            {task.isParallel && (
              <Chip size="sm" variant="flat" color="secondary">
                P
              </Chip>
            )}
            {hasDependencies && (
              <div title={`Depends on: ${task.dependencies.join(', ')}`}>
                <Chip size="sm" variant="flat" color="warning">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </Chip>
              </div>
            )}
          </div>

          {task.storyLabel && (
            <Chip size="sm" variant="flat" color="primary">
              {task.storyLabel}
            </Chip>
          )}
        </div>

        {task.filePath && (
          <p className="text-xs opacity-70 mt-1 truncate font-mono">
            {task.filePath}
          </p>
        )}
      </div>
    </div>
  );
}

export default GanttTask;

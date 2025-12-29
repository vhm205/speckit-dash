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
  return (
    <div className="flex items-stretch gap-3 group">
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

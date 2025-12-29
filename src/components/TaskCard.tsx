/**
 * Speckit Dashboard - Task Card Component
 * Display task information in a card format
 */

import { Card, CardBody, Chip } from './ui';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

const statusConfig = {
  not_started: { label: 'Not Started', color: 'default' as const },
  in_progress: { label: 'In Progress', color: 'warning' as const },
  done: { label: 'Done', color: 'success' as const },
};

export function TaskCard({ task }: TaskCardProps) {
  const status = statusConfig[task.status];

  return (
    <Card hover className="group">
      <CardBody>
        <div className="space-y-3">
          {/* Task ID and Status */}
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
              {task.taskId}
            </span>
            <Chip color={status.color} size="sm">
              {status.label}
            </Chip>
          </div>

          {/* Description */}
          <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
            {task.description}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {task.phase && (
              <Chip color="primary" variant="flat" size="sm">
                {task.phase}
              </Chip>
            )}
            {task.storyLabel && (
              <Chip color="secondary" variant="flat" size="sm">
                {task.storyLabel}
              </Chip>
            )}
            {task.isParallel && (
              <Chip color="secondary" variant="bordered" size="sm">
                Parallel
              </Chip>
            )}
          </div>

          {/* File Path */}
          {task.filePath && (
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate pt-1 border-t border-gray-100 dark:border-gray-700">
              {task.filePath}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default TaskCard;

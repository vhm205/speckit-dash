/**
 * Speckit Dashboard - Kanban Column Component
 * Column displaying tasks of a specific status
 */

import { useState } from 'react';
import TaskCard from '../../components/TaskCard';
import type { Task } from '../../types';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  color: 'gray' | 'amber' | 'emerald';
}

const colorClasses = {
  gray: {
    header: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
  amber: {
    header: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  emerald: {
    header: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    dot: 'bg-success-500',
  },
};

export function KanbanColumn({ title, tasks, color }: KanbanColumnProps) {
  const [limit, setLimit] = useState(5);
  const colors = colorClasses[color];

  const visibleTasks = tasks.slice(0, limit);
  const hasMore = tasks.length > limit;

  return (
    <div className="flex flex-col space-y-3">
      {/* Column Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.header}`}>
        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className="font-medium text-sm">{title}</span>
        <span className="ml-auto text-xs font-mono">{tasks.length}</span>
      </div>

      {/* Task List */}
      <div className="space-y-2 min-h-[100px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No tasks
          </div>
        ) : (
          <>
            {visibleTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {hasMore && (
              <button
                onClick={() => setLimit((prev) => prev + 5)}
                className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors border border-gray-200 dark:border-gray-700"
              >
                Load More
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;

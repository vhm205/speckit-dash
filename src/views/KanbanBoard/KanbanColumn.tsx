/**
 * Speckit Dashboard - Kanban Column Component
 * Column displaying tasks of a specific status
 */

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
  const colors = colorClasses[color];

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
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

export default KanbanColumn;

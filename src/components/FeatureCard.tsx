/**
 * Speckit Dashboard - Feature Card Component
 * Display feature information with progress and metadata
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Progress, Chip } from './ui';
import type { Feature } from '../types';

interface FeatureCardProps {
  feature: Feature;
  taskCount?: number;
  completedTasks?: number;
}

const statusConfig = {
  planning: { label: 'Planning', color: 'default' as const },
  'in-progress': { label: 'In Progress', color: 'warning' as const },
  done: { label: 'Done', color: 'success' as const },
  blocked: { label: 'Blocked', color: 'danger' as const },
};

const priorityConfig = {
  low: { label: 'Low', color: 'default' as const },
  medium: { label: 'Medium', color: 'warning' as const },
  high: { label: 'High', color: 'danger' as const },
};

export function FeatureCard({ feature, taskCount = 0, completedTasks = 0 }: FeatureCardProps) {
  const navigate = useNavigate();
  const status = statusConfig[feature.status as keyof typeof statusConfig] || statusConfig.planning;
  const priority = priorityConfig[feature.priority as keyof typeof priorityConfig] || priorityConfig.medium;

  const progress = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;

  return (
    <Card
      hover
      onClick={() => navigate(`/features/${feature.id}`)}
      className="group"
    >
      <CardBody>
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-mono text-primary-600 dark:text-primary-400 font-semibold">
                {feature.featureNumber}
              </span>
              <Chip color={status.color} size="sm">
                {status.label}
              </Chip>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {feature.title || feature.featureName}
            </h3>
          </div>

          {/* Description */}
          {feature.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {feature.description}
            </p>
          )}

          {/* Progress */}
          {taskCount > 0 && (
            <Progress
              value={completedTasks}
              maxValue={taskCount}
              color={progress === 100 ? 'success' : 'primary'}
              label="Tasks"
              showValueLabel
            />
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Chip color={priority.color} variant="flat" size="sm">
              {priority.label} Priority
            </Chip>
            {feature.phase && (
              <Chip color="secondary" variant="flat" size="sm">
                Phase {feature.phase}
              </Chip>
            )}
            {taskCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                {completedTasks} / {taskCount} tasks
              </span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default FeatureCard;

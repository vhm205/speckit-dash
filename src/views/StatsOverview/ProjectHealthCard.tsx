/**
 * Speckit Dashboard - Project Health Card
 * Stat card showing a single metric with icon
 */

import { Card, CardBody } from '../../components/ui';

interface ProjectHealthCardProps {
  title: string;
  value: number | string;
  icon: 'features' | 'tasks' | 'progress' | 'complete';
  trend: { value: number; isPositive: boolean } | null;
}

const icons = {
  features: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  tasks: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  progress: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  complete: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const iconColors = {
  features: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  tasks: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  progress: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  complete: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function ProjectHealthCard({ title, value, icon, trend }: ProjectHealthCardProps) {
  return (
    <Card className="card-shadow">
      <CardBody className="flex flex-row items-center gap-4 p-4">
        {/* Icon */}
        <div className={`p-3 rounded-xl ${iconColors[icon]}`}>
          {icons[icon]}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default ProjectHealthCard;

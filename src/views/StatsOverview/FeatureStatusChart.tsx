/**
 * Speckit Dashboard - Feature Status Chart
 * Donut chart showing feature counts by status
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FeatureStatusChartProps {
  data: {
    draft: number;
    approved: number;
    in_progress: number;
    complete: number;
  };
}

const COLORS = {
  draft: '#9CA3AF', // gray-400
  approved: '#3B82F6', // blue-500
  in_progress: '#F59E0B', // amber-500
  complete: '#10B981', // emerald-500
};

const LABELS = {
  draft: 'Draft',
  approved: 'Approved',
  in_progress: 'In Progress',
  complete: 'Complete',
};

export function FeatureStatusChart({ data }: FeatureStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key as keyof typeof LABELS],
      value,
      color: COLORS[key as keyof typeof COLORS],
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No features found
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [value, 'Features']}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          iconSize={10}
          formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default FeatureStatusChart;

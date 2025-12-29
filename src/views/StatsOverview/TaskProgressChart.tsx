/**
 * Speckit Dashboard - Task Progress Chart
 * Bar chart showing task counts by status
 */

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface TaskProgressChartProps {
  data: {
    not_started: number;
    in_progress: number;
    done: number;
  };
}

const COLORS = {
  not_started: '#9CA3AF', // gray-400
  in_progress: '#F59E0B', // amber-500
  done: '#10B981', // emerald-500
};

const LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TaskProgressChart({ data }: TaskProgressChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key as keyof typeof LABELS],
    value,
    color: COLORS[key as keyof typeof COLORS],
    key,
  }));

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No tasks found
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6B7280', fontSize: 14 }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => [value, 'Tasks']}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TaskProgressChart;

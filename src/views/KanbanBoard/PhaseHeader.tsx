/**
 * Speckit Dashboard - Phase Header Component
 * Header for phase sections in Kanban board
 */

interface PhaseHeaderProps {
  name: string;
  goal?: string;
}

export function PhaseHeader({ name, goal }: PhaseHeaderProps) {
  return (
    <div className="border-l-4 border-primary-500 pl-4 py-2">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h2>
      {goal && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal}</p>
      )}
    </div>
  );
}

export default PhaseHeader;

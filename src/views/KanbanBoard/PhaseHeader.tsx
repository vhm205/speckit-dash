/**
 * Speckit Dashboard - Phase Header Component
 * Header for phase sections in Kanban board
 */

interface PhaseHeaderProps {
  name: string;
  goal?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function PhaseHeader({ name, goal, isCollapsed, onToggle }: PhaseHeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-l-4 border-primary-500 pl-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-r-lg group"
      onClick={onToggle}
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {name}
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCollapsed ? '(Click to expand)' : '(Click to collapse)'}
          </span>
        </h2>
        {goal && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal}</p>
        )}
      </div>

      <button
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label={isCollapsed ? 'Expand phase' : 'Collapse phase'}
      >
        <svg
          className={`w-5 h-5 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

export default PhaseHeader;


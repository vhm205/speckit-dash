/**
 * ActorNode Component
 * Custom ReactFlow node for representing actors/users in architecture diagrams
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface ActorNodeData {
    label: string;
    type: 'user' | 'admin' | 'system_user' | 'external';
    description?: string;
}

interface ActorNodeProps {
    data: ActorNodeData;
    selected: boolean;
}

export const ActorNode = memo(function ActorNode({ data, selected }: ActorNodeProps) {
    return (
        <div
            className={`
        min-w-[180px] max-w-[220px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30
        rounded-lg shadow-lg border-2
        ${selected ? 'border-blue-500 shadow-blue-500/50' : 'border-blue-300 dark:border-blue-700'}
        transition-all
      `}
        >
            {/* Actor Icon */}
            <div className="flex items-center justify-center pt-3 pb-2">
                <div className="w-14 h-14 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-md">
                    <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                </div>
            </div>

            {/* Actor Label */}
            <div className="px-4 pb-3 text-center">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    {data.label}
                </h3>
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded">
                    {data.type}
                </span>
                {data.description && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />
        </div>
    );
});

export default ActorNode;

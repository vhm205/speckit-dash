/**
 * SystemNode Component
 * Custom ReactFlow node for representing systems/modules in architecture diagrams
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface SystemNodeData {
    label: string;
    type: 'external' | 'internal' | 'module' | 'service';
    description?: string;
}

interface SystemNodeProps {
    data: SystemNodeData;
    selected: boolean;
}

export const SystemNode = memo(function SystemNode({ data, selected }: SystemNodeProps) {
    return (
        <div
            className={`
        min-w-[200px] max-w-[240px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30
        rounded-lg shadow-lg border-2
        ${selected ? 'border-purple-500 shadow-purple-500/50' : 'border-purple-300 dark:border-purple-700'}
        transition-all
      `}
        >
            {/* System Icon & Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 px-4 py-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                    </svg>
                    <h3 className="font-bold text-sm text-white flex-1">
                        {data.label}
                    </h3>
                </div>
            </div>

            {/* System Details */}
            <div className="px-4 py-3">
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded">
                    {data.type}
                </span>
                {data.description && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Connection Handles - All sides for systems */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />
        </div>
    );
});

export default SystemNode;

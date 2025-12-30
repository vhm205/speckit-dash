/**
 * DataNode Component
 * Custom ReactFlow node for representing data stores/databases in architecture diagrams
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface DataNodeData {
    label: string;
    type: 'database' | 'cache' | 'storage' | 'queue';
    description?: string;
}

interface DataNodeProps {
    data: DataNodeData;
    selected: boolean;
}

export const DataNode = memo(function DataNode({ data, selected }: DataNodeProps) {
    return (
        <div
            className={`
        min-w-[180px] max-w-[220px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30
        rounded-lg shadow-lg border-2
        ${selected ? 'border-green-500 shadow-green-500/50' : 'border-green-300 dark:border-green-700'}
        transition-all
      `}
        >
            {/* Database Icon */}
            <div className="flex items-center justify-center pt-3 pb-2">
                <div className="w-14 h-14 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center shadow-md">
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
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        />
                    </svg>
                </div>
            </div>

            {/* Data Store Label */}
            <div className="px-4 pb-3 text-center">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    {data.label}
                </h3>
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-700 dark:text-green-300 rounded">
                    {data.type}
                </span>
                {data.description && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Connection Handles - All sides for data stores */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-green-500 border-2 border-white"
            />
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-green-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-green-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-green-500 border-2 border-white"
            />
        </div>
    );
});

export default DataNode;

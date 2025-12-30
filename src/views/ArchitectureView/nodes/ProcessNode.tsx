/**
 * ProcessNode Component
 * Custom ReactFlow node for representing processes/actions in architecture diagrams
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

interface ProcessNodeData {
    label: string;
    description?: string;
}

interface ProcessNodeProps {
    data: ProcessNodeData;
    selected: boolean;
}

export const ProcessNode = memo(function ProcessNode({ data, selected }: ProcessNodeProps) {
    return (
        <div
            className={`
        min-w-[180px] max-w-[220px] bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30
        rounded-lg shadow-lg border-2
        ${selected ? 'border-orange-500 shadow-orange-500/50' : 'border-orange-300 dark:border-orange-700'}
        transition-all
      `}
        >
            {/* Process Icon & Label */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 dark:bg-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {data.label}
                        </h3>
                    </div>
                </div>
                {data.description && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {data.description}
                    </p>
                )}
            </div>

            {/* Connection Handles - Left and Right for flow */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-orange-500 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-orange-500 border-2 border-white"
            />
        </div>
    );
});

export default ProcessNode;

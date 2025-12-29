/**
 * Entity Node Component
 * Custom ReactFlow node for displaying entities in the schema diagram
 */

import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface EntityNodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
}

export function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-all
        ${selected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
        }
        min-w-[180px] max-w-[250px]
      `}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-violet-500 border-2 border-white dark:border-gray-800"
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-t-md">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {data.entityName}
        </h3>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {data.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {data.attributeCount} attrs
          </span>
          <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {data.relationshipCount} rels
          </span>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-violet-500 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
}

export default EntityNode;

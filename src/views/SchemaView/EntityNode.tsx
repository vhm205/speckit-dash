/**
 * Entity Node Component
 * Custom ReactFlow node for displaying entities in the schema diagram
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

interface EntityAttribute {
  name: string;
  type: string;
  constraints?: string | null;
}

interface EntityRelationship {
  target: string;
  type: string;
  description?: string | null;
}

export interface EntityNodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
  attributes?: EntityAttribute[];
  relationships?: EntityRelationship[];
}

export const EntityNode = memo(function EntityNode({ data, selected }: NodeProps<EntityNodeData>) {
  const attributes = data.attributes || [];
  const relationships = data.relationships || [];

  return (
    <div
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 transition-all
        ${selected
          ? 'border-violet-500 shadow-lg shadow-violet-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
        }
        min-w-[220px] max-w-[280px]
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
        {data.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      {/* Attributes Section */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
          Attributes ({data.attributeCount})
        </div>
        {attributes.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No attributes defined</p>
        ) : (
          <ul className="space-y-0.5">
            {attributes.slice(0, 5).map((attr, index) => (
              <li key={index} className="flex items-center text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                  {attr.name}
                </span>
                <span className="text-gray-400 mx-1">:</span>
                <span className="text-violet-500 font-mono text-[10px] truncate max-w-[100px]">
                  {attr.type}
                </span>
              </li>
            ))}
            {attributes.length > 5 && (
              <li className="text-xs text-gray-400 italic">
                +{attributes.length - 5} more...
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Relationships Section */}
      {relationships.length > 0 && (
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
            Relations ({data.relationshipCount})
          </div>
          <ul className="space-y-0.5">
            {relationships.slice(0, 3).map((rel, index) => (
              <li key={index} className="flex items-center gap-1 text-xs">
                <svg className="w-3 h-3 text-violet-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-purple-500 font-mono text-[10px]">{rel.type}</span>
                <span className="text-gray-600 dark:text-gray-400 truncate">{rel.target}</span>
              </li>
            ))}
            {relationships.length > 3 && (
              <li className="text-xs text-gray-400 italic">
                +{relationships.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-violet-500 border-2 border-white dark:border-gray-800"
      />
    </div>
  );
});

export default EntityNode;

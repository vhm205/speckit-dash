/**
 * Speckit Dashboard - Entity Node Component
 * Custom ReactFlow node for displaying entity information
 */

import { memo } from 'react';
import { Handle, Position } from 'reactflow';

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

interface EntityNodeData {
  label: string;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected: boolean;
}

export const EntityNode = memo(function EntityNode({ data, selected }: EntityNodeProps) {
  return (
    <div
      className={`
        min-w-[250px] max-w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2
        ${selected ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'}
        transition-all
      `}
    >
      {/* Entity Name Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-t-lg">
        <h3 className="font-bold text-sm">{data.label}</h3>
      </div>

      {/* Attributes */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
          Attributes
        </div>
        {data.attributes.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No attributes defined</p>
        ) : (
          <ul className="space-y-0.5">
            {data.attributes.slice(0, 6).map((attr, index) => (
              <li key={index} className="flex items-center text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">{attr.name}</span>
                <span className="text-gray-400 mx-1">:</span>
                <span className="text-primary-500 font-mono">{attr.type}</span>
              </li>
            ))}
            {data.attributes.length > 6 && (
              <li className="text-xs text-gray-400 italic">
                +{data.attributes.length - 6} more...
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Relationships */}
      {data.relationships.length > 0 && (
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
            Relations
          </div>
          <ul className="space-y-0.5">
            {data.relationships.map((rel, index) => (
              <li key={index} className="flex items-center gap-1 text-xs">
                <span className="text-accent-500 font-mono text-[10px]">{rel.type}</span>
                <span className="text-gray-600 dark:text-gray-400">{rel.target}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary-500 border-2 border-white"
      />
    </div>
  );
});

export default EntityNode;

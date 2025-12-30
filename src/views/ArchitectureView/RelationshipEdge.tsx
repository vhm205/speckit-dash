/**
 * RelationshipEdge Component
 * Custom ReactFlow edge for displaying entity relationships with type labels
 */

import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

interface RelationshipEdgeData {
  label?: string;
  relationshipType?: '1:1' | '1:N' | 'N:1' | 'N:N';
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style = {},
}: EdgeProps<RelationshipEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationshipType = data?.relationshipType || data?.label || '1:N';

  // Determine edge styling based on relationship type
  const strokeDasharray = relationshipType === 'N:N' ? '5,5' : undefined;

  const edgeStyle = {
    ...style,
    stroke: style.stroke || '#6366f1',
    strokeWidth: style.strokeWidth || 2,
    strokeDasharray: strokeDasharray,
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-700 rounded px-2 py-0.5 text-xs font-semibold text-primary-600 dark:text-primary-400 shadow-sm">
            {relationshipType}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

export default RelationshipEdge;

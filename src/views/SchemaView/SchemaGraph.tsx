/**
 * Schema Graph Component
 * ReactFlow canvas for displaying entity relationship diagrams
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import EntityNode from './EntityNode';

interface EntityNodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
}

interface SchemaGraphProps {
  nodes: Node<EntityNodeData>[];
  edges: Edge[];
  onNodeSelect: (nodeId: string) => void;
  selectedNodeId?: string;
}

// Custom node types
const nodeTypes = {
  entity: EntityNode,
};

// Default edge options
const defaultEdgeOptions = {
  animated: true,
  style: {
    strokeWidth: 2,
    stroke: '#a78bfa', // violet-400
  },
  labelStyle: {
    fill: '#6b7280',
    fontSize: 12,
  },
  labelBgStyle: {
    fill: '#ffffff',
  },
};

export function SchemaGraph({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeSelect,
  selectedNodeId,
}: SchemaGraphProps) {
  // Use ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when initial data changes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Extract entity ID from node ID (format: entity-{id})
      const entityId = node.id.replace('entity-', '');
      onNodeSelect(entityId);
    },
    [onNodeSelect]
  );

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="schema-flow"
      >
        <Background
          color="#e5e7eb"
          gap={16}
          size={1}
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          className="!bg-white dark:!bg-gray-800 !shadow-lg !border !border-gray-200 dark:!border-gray-700 !rounded-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === selectedNodeId) return '#8b5cf6'; // violet-500
            return '#e5e7eb'; // gray-200
          }}
          className="!bg-white dark:!bg-gray-800 !border !border-gray-200 dark:!border-gray-700 !rounded-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />

        {/* Legend Panel */}
        <Panel position="top-left" className="!m-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Legend
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 border border-gray-300 dark:border-gray-600"></div>
                <span className="text-gray-600 dark:text-gray-300">Entity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-violet-400"></div>
                <span className="text-gray-600 dark:text-gray-300">Relationship</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default SchemaGraph;

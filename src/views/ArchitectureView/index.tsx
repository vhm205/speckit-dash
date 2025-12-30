/**
 * Speckit Dashboard - Architecture View
 * Entity diagram visualization using ReactFlow with Dagre auto-layout
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardBody, Button, Chip } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import EntityNode from './EntityNode';
import RelationshipEdge from './RelationshipEdge';
import { getLayoutedElements } from './layout-utils';
import type { Feature, Entity } from '../../types';

// Custom node and edge types
const nodeTypes = {
  entity: EntityNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

export function ArchitectureView() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    async function loadFeatureData() {
      if (!featureId) {
        setIsLoading(false);
        setError('No feature ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await window.electronAPI.getFeature(Number(featureId));
        if (response.success && response.data) {
          setFeature(response.data.feature);
          setEntities(response.data.entities);
        } else if (!response.success) {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setIsLoading(false);
      }
    }

    loadFeatureData();
  }, [featureId]);

  // Convert entities to ReactFlow nodes and edges with Dagre auto-layout
  useEffect(() => {
    if (entities.length === 0) return;

    // Create nodes (position will be calculated by Dagre)
    const newNodes: Node[] = entities.map((entity) => ({
      id: String(entity.id),
      type: 'entity',
      position: { x: 0, y: 0 }, // Temporary position, will be updated by layout
      data: {
        label: entity.entityName,
        attributes: entity.attributes || [],
        relationships: entity.relationships || [],
      },
    }));

    // Create edges from relationships
    const newEdges: Edge[] = [];
    entities.forEach((entity) => {
      (entity.relationships || []).forEach((rel, index) => {
        const targetEntity = entities.find(
          (e) => e.entityName.toLowerCase() === rel.target.toLowerCase()
        );
        if (targetEntity) {
          newEdges.push({
            id: `${entity.id}-${targetEntity.id}-${index}`,
            source: String(entity.id),
            target: String(targetEntity.id),
            type: 'relationship',
            data: { relationshipType: rel.type as '1:1' | '1:N' | 'N:1' | 'N:N' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
            style: { stroke: '#6366f1', strokeWidth: 2 },
          });
        }
      });
    });

    // Apply Dagre auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges,
      { direction: 'TB', nodeWidth: 280, nodeHeight: 200 }
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [entities, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading architecture..." />
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md bg-red-50 dark:bg-red-900/20">
          <CardBody className="text-center py-8">
            <p className="text-red-500 mb-4">{error || 'Feature not found'}</p>
            <Button onPress={() => navigate('/features')}>Back to Features</Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={() => navigate('/features')}
          aria-label="Back to features"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {feature.featureNumber}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {feature.title || feature.featureName} - Architecture
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/kanban`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">View Tasks</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/gantt`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">View Timeline</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/summary`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">View Summary</span>
          </Button>
        </div>
        <Chip color="primary" variant="flat">
          {entities.length} Entities
        </Chip>
      </div>

      {/* Diagram */}
      {entities.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Entities Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add entities to data-model.md to visualize the architecture.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="h-[600px] overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap
              nodeColor="#6366f1"
              maskColor="rgba(0, 0, 0, 0.1)"
              className="bg-white dark:bg-gray-800"
            />
            <Panel position="top-right" className="bg-white dark:bg-gray-800 p-2 rounded shadow">
              <div className="text-xs text-gray-500">
                Drag to pan • Scroll to zoom
              </div>
            </Panel>
          </ReactFlow>
        </Card>
      )}
    </div>
  );
}

export default ArchitectureView;

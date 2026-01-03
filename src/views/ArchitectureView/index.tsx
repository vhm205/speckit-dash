/**
 * Speckit Dashboard - Architecture View
 * AI-powered architecture workflow visualization using ReactFlow
 */

import { useEffect, useState, useCallback } from 'react';
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
import { architectureNodeTypes } from './nodes';
import { getLayoutedElements } from './layout-utils';
import { useArchitecture } from '../../hooks/useArchitecture';
import type { Feature, ArchitectureResult } from '../../types';

export function ArchitectureView() {
  const { featureId } = useParams<{ featureId: string }>();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoadingFeature, setIsLoadingFeature] = useState(true);
  const [featureError, setFeatureError] = useState<string | null>(null);

  const { isLoading: isAnalyzing, error: analysisError, analyzeArchitecture, clearError } = useArchitecture();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load feature metadata
  useEffect(() => {
    async function loadFeature() {
      if (!featureId) {
        setIsLoadingFeature(false);
        setFeatureError('No feature ID provided');
        return;
      }

      setIsLoadingFeature(true);
      setFeatureError(null);

      try {
        const response = await window.electronAPI.getFeature(Number(featureId));
        if (response.success && response.data) {
          setFeature(response.data.feature);
        } else if (!response.success) {
          setFeatureError('error' in response ? response.error : 'Failed to load feature');
        }
      } catch (err) {
        setFeatureError(err instanceof Error ? err.message : 'Failed to load feature');
      } finally {
        setIsLoadingFeature(false);
      }
    }

    loadFeature();
  }, [featureId]);

  // Convert architecture data to ReactFlow nodes and edges
  const convertToReactFlowElements = useCallback((architecture: ArchitectureResult) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create actor nodes
    architecture.actors.forEach((actor) => {
      newNodes.push({
        id: actor.id,
        type: 'actor',
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          label: actor.label,
          type: actor.type,
          description: actor.description,
        },
      });
    });

    // Create system nodes
    architecture.systems.forEach((system) => {
      newNodes.push({
        id: system.id,
        type: 'system',
        position: { x: 0, y: 0 },
        data: {
          label: system.label,
          type: system.type,
          description: system.description,
        },
      });
    });

    // Create process nodes
    architecture.processes.forEach((process) => {
      newNodes.push({
        id: process.id,
        type: 'process',
        position: { x: 0, y: 0 },
        data: {
          label: process.label,
          description: process.description,
        },
      });
    });

    // Create data store nodes
    architecture.dataStores.forEach((dataStore) => {
      newNodes.push({
        id: dataStore.id,
        type: 'data',
        position: { x: 0, y: 0 },
        data: {
          label: dataStore.label,
          type: dataStore.type,
          description: dataStore.description,
        },
      });
    });

    // Create edges from connections
    architecture.connections.forEach((connection) => {
      newEdges.push({
        id: connection.id,
        source: connection.from,
        target: connection.to,
        type: 'smoothstep',
        label: connection.label,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#64748b', strokeWidth: 2 },
      });
    });

    // Apply auto-layout with increased spacing for architectural diagrams
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges,
      {
        direction: 'TB',
        nodeWidth: 240,
        nodeHeight: 180,
        rankSeparation: 180,  // More vertical space between levels
        nodeSeparation: 120,  // More horizontal space between nodes
      },
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

  // Trigger architecture analysis
  const handleAnalyzeArchitecture = useCallback(async (force: boolean = false) => {
    if (!featureId) return;

    clearError();
    const result = await analyzeArchitecture(Number(featureId), force);

    if (result) {
      convertToReactFlowElements(result);
    }
  }, [featureId, analyzeArchitecture, clearError, convertToReactFlowElements]);

  // Auto-analyze on mount
  useEffect(() => {
    if (featureId && !isLoadingFeature && feature) {
      handleAnalyzeArchitecture();
    }
  }, [featureId, isLoadingFeature, feature, handleAnalyzeArchitecture]);

  const isLoading = isLoadingFeature || isAnalyzing;
  const error = featureError || analysisError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label={isAnalyzing ? "AI is analyzing architecture..." : "Loading feature..."} />
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

  const totalComponents = nodes.length;

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
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/schema`)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="hidden sm:inline">View Schema</span>
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => navigate(`/features/${featureId}/ai-analysis`)}
            className="text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="hidden sm:inline">AI Analysis</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onPress={() => handleAnalyzeArchitecture(true)}
            isDisabled={isAnalyzing}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <Chip color="primary" variant="flat">
          {totalComponents} Components
        </Chip>
      </div>

      {/* Architecture Diagram */}
      {nodes.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Architecture Information Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              The AI couldn&apos;t extract architecture components from the documentation.
              <br />
              Ensure your spec.md, plan.md, or other documentation files contain architectural details.
            </p>
            <Button variant="primary" onPress={() => handleAnalyzeArchitecture(true)}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card className="h-[calc(100vh-200px)] overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={architectureNodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'actor': return '#3b82f6';  // Blue
                  case 'system': return '#a855f7';  // Purple
                  case 'process': return '#f97316'; // Orange
                  case 'data': return '#10b981';     // Green
                  default: return '#6366f1';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              className="bg-white dark:bg-gray-800"
            />
            <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded shadow-lg">
              <div className="text-xs space-y-2">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Legend</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Actors/Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Systems/Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Processes/Actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Data Stores</span>
                </div>
              </div>
            </Panel>
            <Panel position="bottom-right" className="bg-white dark:bg-gray-800 p-2 rounded shadow text-xs text-gray-500">
              Drag to pan • Scroll to zoom
            </Panel>
          </ReactFlow>
        </Card>
      )}
    </div>
  );
}

export default ArchitectureView;

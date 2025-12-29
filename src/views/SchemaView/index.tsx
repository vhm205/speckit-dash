/**
 * Schema View Main Component
 * Interactive entity relationship diagram view
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardBody, Button } from '../../components/ui';
import { useSchema } from '../../hooks/useSchema';
import SchemaGraph from './SchemaGraph';
import EntityDetails from './EntityDetails';

export function SchemaView() {
  const { featureId } = useParams<{ featureId: string }>();
  const {
    nodes,
    edges,
    metadata,
    selectedEntity,
    isLoading,
    error,
    generateSchema,
    selectEntity,
    clearSelection,
  } = useSchema();

  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();

  const numericFeatureId = featureId ? parseInt(featureId, 10) : null;

  // Load schema on mount
  useEffect(() => {
    if (numericFeatureId) {
      generateSchema(numericFeatureId);
    }
  }, [numericFeatureId, generateSchema]);

  const handleNodeSelect = (entityId: string) => {
    setSelectedNodeId(`entity-${entityId}`);
    selectEntity(parseInt(entityId, 10));
  };

  const handleCloseDetails = () => {
    setSelectedNodeId(undefined);
    clearSelection();
  };

  if (!numericFeatureId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardBody className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Select a feature to view its schema
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Generating schema diagram...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schema Visualization
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Entity relationship diagram
          </p>
        </div>

        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardBody className="py-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-amber-600 dark:text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Entities Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                {error || 'This feature does not have any entities defined in the data model.'}
              </p>
              <Button
                variant="secondary"
                onClick={() => numericFeatureId && generateSchema(numericFeatureId)}
              >
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schema Visualization
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Entity relationship diagram
          </p>
        </div>

        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              No Schema Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Add a data-model.md file with entity definitions to generate a schema diagram.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schema Visualization
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {metadata?.entityCount || 0} entities, {metadata?.relationshipCount || 0} relationships
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => numericFeatureId && generateSchema(numericFeatureId)}
        >
          Refresh
        </Button>
      </div>

      {/* Graph Container */}
      <div className="flex-1 flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Main Graph */}
        <div className="flex-1">
          <SchemaGraph
            nodes={nodes}
            edges={edges}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />
        </div>

        {/* Entity Details Panel */}
        {selectedEntity && (
          <EntityDetails entity={selectedEntity} onClose={handleCloseDetails} />
        )}
      </div>
    </div>
  );
}

export default SchemaView;

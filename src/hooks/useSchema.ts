/**
 * Schema View Hook
 * Provides methods for schema generation and entity management
 */

import { useCallback, useState } from "react";
import type { Edge, Node } from "reactflow";

// ============================================================================
// Types
// ============================================================================

export interface EntityNodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
  attributes?: Array<{
    name: string;
    type: string;
    constraints?: string | null;
  }>;
  relationships?: Array<{
    target: string;
    type: string;
    description?: string | null;
  }>;
}

export interface EntityDetail {
  id: number;
  entityName: string;
  description: string | null;
  attributes: Array<{
    name: string;
    type: string;
    description?: string;
    constraints?: string | null;
  }>;
  relationships: Array<{
    target: string;
    type: string;
    description?: string;
  }>;
  validationRules: string[];
  sourceFile: string | null;
  lineNumber: number | null;
}

export interface SchemaMetadata {
  entityCount: number;
  relationshipCount: number;
  generatedAt: number;
}

interface UseSchemaReturn {
  nodes: Node<EntityNodeData>[];
  edges: Edge[];
  metadata: SchemaMetadata | null;
  selectedEntity: EntityDetail | null;
  isLoading: boolean;
  error: string | null;
  generateSchema: (featureId: number) => Promise<void>;
  selectEntity: (entityId: number) => Promise<void>;
  clearSelection: () => void;
  clearError: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useSchema(): UseSchemaReturn {
  const [nodes, setNodes] = useState<Node<EntityNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [metadata, setMetadata] = useState<SchemaMetadata | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearSelection = useCallback(() => setSelectedEntity(null), []);

  const generateSchema = useCallback(async (featureId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.generateSchema(featureId);

      if (response.success && response.data) {
        setNodes(response.data.nodes as Node<EntityNodeData>[]);
        setEdges(response.data.edges as Edge[]);
        setMetadata(response.data.metadata as SchemaMetadata);
      } else {
        setError(
          "error" in response ? response.error : "Failed to generate schema",
        );
        setNodes([]);
        setEdges([]);
        setMetadata(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Schema generation failed");
      setNodes([]);
      setEdges([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectEntity = useCallback(async (entityId: number) => {
    try {
      const response = await window.electronAPI.getEntityDetails(entityId);

      if (response.success && response.data?.entity) {
        setSelectedEntity(response.data.entity as EntityDetail);
      } else {
        setError(
          "error" in response
            ? response.error
            : "Failed to load entity details",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entity");
    }
  }, []);

  return {
    nodes,
    edges,
    metadata,
    selectedEntity,
    isLoading,
    error,
    generateSchema,
    selectEntity,
    clearSelection,
    clearError,
  };
}

export default useSchema;

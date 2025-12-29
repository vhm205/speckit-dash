/**
 * Schema Visualization TypeScript Type Definitions
 * Types for entity relationship diagrams and ReactFlow integration
 */

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Attribute of an entity
 */
export interface EntityAttribute {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
}

/**
 * Relationship between entities
 */
export interface EntityRelationship {
  type: "one-to-one" | "one-to-many" | "many-to-many";
  target: string;
  description?: string;
}

/**
 * Parsed entity from specification Key Entities section
 */
export interface ParsedEntity {
  id: number;
  featureId: number;
  entityName: string;
  description: string;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  validationRules?: Record<string, unknown> | null;
  stateTransitions?: Record<string, unknown> | null;
  sourceFile: string;
  lineNumber: number | null;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Schema Graph Types (ReactFlow)
// ============================================================================

/**
 * Position coordinates for nodes
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Data attached to entity nodes
 */
export interface EntityNodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
  sourceFile?: string;
  lineNumber?: number | null;
}

/**
 * Schema node for ReactFlow
 */
export interface SchemaNode {
  id: string;
  type: "entity";
  position: Position;
  data: EntityNodeData;
  style?: React.CSSProperties;
}

/**
 * Edge marker configuration
 */
export interface EdgeMarker {
  type: "arrow" | "arrowclosed";
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Schema edge for ReactFlow
 */
export interface SchemaEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep" | "straight" | "step" | "bezier";
  label?: string;
  animated?: boolean;
  markerEnd?: EdgeMarker;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

/**
 * Layout configuration for dagre
 */
export interface LayoutConfig {
  rankdir: "TB" | "BT" | "LR" | "RL";
  nodesep: number;
  ranksep: number;
  marginx?: number;
  marginy?: number;
}

/**
 * Complete schema graph representation
 */
export interface SchemaGraph {
  featureId: number;
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  layout: LayoutConfig;
  generatedAt: number;
}

/**
 * Schema metadata for API responses
 */
export interface SchemaMetadata {
  entityCount: number;
  relationshipCount: number;
  generatedAt: number;
}

// ============================================================================
// IPC Request/Response Types
// ============================================================================

/**
 * Generate schema request
 */
export interface GenerateSchemaRequest {
  featureId: number;
}

/**
 * Generate schema response data
 */
export interface GenerateSchemaResult {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
  metadata: SchemaMetadata;
}

/**
 * Get entity details request
 */
export interface GetEntityDetailsRequest {
  entityId: number;
}

/**
 * Entity details response
 */
export interface EntityDetails {
  id: number;
  entityName: string;
  description: string;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
  sourceFile: string;
  lineNumber: number | null;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * In-memory cache entry for schema graphs
 */
export interface SchemaCacheEntry {
  featureId: number;
  graph: SchemaGraph;
  expiresAt: number;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Selected node state for detail panel
 */
export interface SelectedNodeState {
  nodeId: string | null;
  entityId: number | null;
}

/**
 * Schema view state
 */
export interface SchemaViewState {
  isLoading: boolean;
  error: string | null;
  graph: SchemaGraph | null;
  selectedNode: SelectedNodeState;
  zoomLevel: number;
}

/**
 * Schema view actions
 */
export type SchemaViewAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; payload: SchemaGraph }
  | { type: "LOAD_ERROR"; payload: string }
  | { type: "SELECT_NODE"; payload: SelectedNodeState }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_ZOOM"; payload: number }
  | { type: "RESET" };

# Data Model

**Feature**:
[001-speckit-ai-visualization](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/spec.md)\
**Created**: 2025-12-29\
**Purpose**: Define data structures for AI provider integration and schema
visualization

## Entity Definitions

### 1. AIProviderConfig

Stores user's AI provider configuration and credentials.

**Attributes**:

- `activeProvider`: string - Current active provider ("openai" | "ollama")
- `openai`: OpenAIConfig | null - OpenAI-specific configuration
- `ollama`: OllamaConfig | null - Ollama-specific configuration

**Validation Rules**:

- `activeProvider` must be either "openai" or "ollama"
- At least one provider (openai or ollama) must be configured
- If activeProvider is "openai", openai config must not be null
- If activeProvider is "ollama", ollama config must not be null

**Storage**: electron-store (persisted to disk)

**Relationships**:

- Used by AIProviderService for model selection
- Referenced by AnalysisRequest for provider routing

---

### 2. OpenAIConfig

OpenAI provider-specific settings.

**Attributes**:

- `apiKey`: string (encrypted) - OpenAI API key
- `model`: string - Model name (e.g., "gpt-3.5-turbo", "gpt-4")
- `baseURL`: string - API endpoint (default: "https://api.openai.com/v1")
- `organization`: string | null - OpenAI organization ID (optional)

**Validation Rules**:

- `apiKey` must not be empty when provider is active
- `model` must be valid OpenAI model name
- `baseURL` must be valid URL format

**Storage**: electron-store with encrypted apiKey

---

### 3. OllamaConfig

Ollama provider-specific settings.

**Attributes**:

- `baseURL`: string - Ollama API endpoint (default: "http://localhost:11434")
- `model`: string - Model name (e.g., "llama2", "mixtral")
- `timeout`: number - Request timeout in ms (default: 30000)

**Validation Rules**:

- `baseURL` must be valid URL format
- `model` must not be empty
- `timeout` must be positive integer

**Storage**: electron-store

---

### 4. AnalysisRequest

Represents a user-initiated AI analysis operation.

**Attributes**:

- `id`: string (UUID) - Unique request identifier
- `type`: AnalysisType - Type of analysis (summary | consistency | gaps)
- `featureId`: number - Database ID of feature being analyzed
- `inputFiles`: string[] - Array of file paths to analyze
- `provider`: string - Provider used ("openai" | "ollama")
- `model`: string - Specific model used
- `status`: RequestStatus - Current status (pending | processing | completed |
  failed)
- `createdAt`: number - Timestamp when created
- `completedAt`: number | null - Timestamp when completed

**Validation Rules**:

- `type` must be valid AnalysisType enum value
- `featureId` must exist in database
- `inputFiles` must be non-empty array
- `status` must be valid RequestStatus enum value

**State Transitions**:

- pending → processing (when analysis starts)
- processing → completed (on success)
- processing → failed (on error)
- No transitions allowed from completed or failed

**Relationships**:

- References Feature (many-to-one)
- Produces AnalysisResult (one-to-one)

---

### 5. AnalysisResult

Stores the output from an AI analysis operation.

**Attributes**:

- `id`: number - Auto-increment primary key
- `requestId`: string (UUID) - Foreign key to AnalysisRequest
- `featureId`: number - Foreign key to Feature
- `analysisType`: AnalysisType - Type of analysis performed
- `content`: string (JSON) - Analysis output (structure varies by type)
- `tokenCount`: number | null - Tokens used in request (if available)
- `duration`: number - Time taken in milliseconds
- `createdAt`: number - Timestamp when created

**Validation Rules**:

- `content` must be valid JSON string
- `duration` must be positive integer
- `tokenCount` if provided must be positive integer

**Storage**: SQLite database (new table)

**Relationships**:

- Belongs to Feature (many-to-one)
- Belongs to AnalysisRequest (one-to-one)

**Indexes**:

- Index on `featureId` for fast lookup
- Index on `analysisType` for filtering
- Unique index on `requestId`

---

### 6. ParsedEntity

Represents an entity extracted from specification markdown.

**Attributes**:

- `id`: number - Auto-increment primary key (existing table)
- `featureId`: number - Foreign key to Feature (existing)
- `entityName`: string - Name of entity (existing)
- `description`: string - Entity description (existing)
- `attributes`: Attribute[] - List of entity attributes (existing, JSON)
- `relationships`: Relationship[] - List of relationships (existing, JSON)
- `validationRules`: any | null - Validation rules (existing, JSON, optional)
- `stateTransitions`: any | null - State transitions (existing, JSON, optional)
- `sourceFile`: string - Path to file where entity was defined (NEW)
- `lineNumber`: number | null - Line number in source file (NEW)

**Validation Rules**:

- `entityName` must be unique within feature
- `attributes` must be valid JSON array
- `relationships` must be valid JSON array

**Enhancement**: Add sourceFile and lineNumber for traceability

**Relationships**:

- Belongs to Feature (many-to-one, existing)
- Referenced in SchemaGraph (one-to-many)

---

### 7. SchemaGraph

In-memory representation of entity relationship graph for visualization.

**Attributes**:

- `featureId`: number - Associated feature ID
- `nodes`: SchemaNode[] - Array of entity nodes
- `edges`: SchemaEdge[] - Array of relationship edges
- `layout`: LayoutConfig - Dagre layout configuration
- `generatedAt`: number - Timestamp when generated

**Validation Rules**:

- `nodes` must have at least one element
- Each node must have unique ID
- Edge source and target must reference existing node IDs

**Storage**: In-memory cache (main process)

**Lifecycle**:

- Generated on-demand when schema view is opened
- Cached for 5 minutes
- Invalidated on file changes

---

### 8. SchemaNode

Represents an entity node in the visualization graph.

**Attributes**:

- `id`: string - Unique node identifier (derived from entity name)
- `type`: string - Node type (always "entity" for this feature)
- `position`: Position - { x: number, y: number }
- `data`: NodeData - { entityName, description, attributeCount,
  relationshipCount }
- `style`: React.CSSProperties | null - Custom styling

**Validation Rules**:

- `id` must be unique within graph
- `position` coordinates must be finite numbers
- `data.entityName` must match source entity name

---

### 9. SchemaEdge

Represents a relationship edge in the visualization graph.

**Attributes**:

- `id`: string - Unique edge identifier
- `source`: string - Source node ID
- `target`: string - Target node ID
- `type`: string - Edge type (default: "smoothstep")
- `label`: string | null - Relationship label (e.g., "has many", "belongs to")
- `animated`: boolean - Whether edge is animated
- `markerEnd`: MarkerType - Arrow marker configuration

**Validation Rules**:

- `source` must reference existing node ID
- `target` must reference existing node ID
- `source` and `target` must be different (no self-loops)

---

### 10. AIAnalysisCache

In-memory cache for recent AI analysis results to avoid redundant API calls.

**Attributes**:

- `key`: string - Cache key (hash of request parameters)
- `value`: AnalysisResult - Cached analysis result
- `expiresAt`: number - Timestamp when cache expires
- `hits`: number - Number of cache hits for metrics

**Validation Rules**:

- `key` must be unique
- `expiresAt` must be in the future
- Cache entries with `expiresAt` < now are automatically evicted

**Storage**: In-memory Map in main process

**Cache Strategy**:

- TTL: 30 minutes for AI analysis results
- Max size: 100 entries (LRU eviction)
- Invalidation: on file changes to analyzed features

---

## Type Definitions

### AnalysisType Enum

```typescript
type AnalysisType = "summary" | "consistency" | "gaps";
```

### RequestStatus Enum

```typescript
type RequestStatus = "pending" | "processing" | "completed" | "failed";
```

### Attribute Interface

```typescript
interface Attribute {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
}
```

### Relationship Interface

```typescript
interface Relationship {
  type: "one-to-one" | "one-to-many" | "many-to-many";
  target: string; // Target entity name
  description?: string;
}
```

### Position Interface

```typescript
interface Position {
  x: number;
  y: number;
}
```

### NodeData Interface

```typescript
interface NodeData {
  entityName: string;
  description: string;
  attributeCount: number;
  relationshipCount: number;
}
```

---

## Database Schema Changes

### New Table: analysis_results

```sql
CREATE TABLE IF NOT EXISTS analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  feature_id INTEGER NOT NULL,
  analysis_type TEXT NOT NULL CHECK(analysis_type IN ('summary', 'consistency', 'gaps')),
  content TEXT NOT NULL,  -- JSON
  token_count INTEGER,
  duration INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

CREATE INDEX idx_analysis_results_feature ON analysis_results(feature_id);
CREATE INDEX idx_analysis_results_type ON analysis_results(analysis_type);
```

### Enhanced Table: entities (add columns)

```sql
ALTER TABLE entities ADD COLUMN source_file TEXT;
ALTER TABLE entities ADD COLUMN line_number INTEGER;
```

---

## Validation Summary

All entities follow consistent patterns:

- Required fields explicitly marked
- Enums for constrained values
- Foreign keys for relationships
- Indexes for performance
- Timestamps for auditing
- JSON fields for flexible nested data

Data model supports all functional requirements (FR-001 through FR-020) with
particular focus on:

- **FR-006**: AI SDK integration via provider configs
- **FR-007/FR-008**: OpenAI and Ollama configuration
- **FR-009**: Schema transformation via ParsedEntity
- **FR-010/FR-011/FR-012**: AI analysis via AnalysisRequest/Result
- **FR-013**: Schema visualization via SchemaGraph
- **FR-016**: Secure configuration persistence
- **FR-020**: Two-tier caching strategy

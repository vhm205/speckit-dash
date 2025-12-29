# IPC Contracts for AI SDK Integration

**Feature**:
[001-speckit-ai-visualization](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/spec.md)\
**Created**: 2025-12-29\
**Purpose**: Define IPC communication contracts between main and renderer
processes

## Overview

All IPC handlers follow the existing pattern established in
`electron/services/ipc-handlers.ts`:

- Handle function signature: `async (_event, params) => Promise<IPCResponse>`
- Consistent error handling with `{ success, error, code, data }` response
  structure
- Type-safe parameter validation

---

## AI Provider Configuration Handlers

### `ai-provider:configure`

Configure AI provider settings (OpenAI or Ollama).

**Request**:

```typescript
{
  provider: "openai" | "ollama";
  config: OpenAIConfig | OllamaConfig;
}

interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

interface OllamaConfig {
  baseURL: string;
  model: string;
  timeout?: number;
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "VALIDATION_ERROR" | "ENCRYPTION_ERROR" | "STORAGE_ERROR";
  data?: {
    activeProvider: string;
  };
}
```

**Validation**:

- `provider` must be "openai" or "ollama"
- For OpenAI: `apiKey` must not be empty, will be encrypted before storage
- For Ollama: `baseURL` must be valid URL format
- `model` must not be empty for both providers

---

### `ai-provider:get-config`

Retrieve current AI provider configuration.

**Request**:

```typescript
{} // No parameters
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "NOT_CONFIGURED";
  data?: {
    activeProvider: "openai" | "ollama" | null;
    openai?: {
      model: string;
      baseURL: string;
      hasApiKey: boolean;  // Don't expose actual key
    };
    ollama?: {
      baseURL: string;
      model: string;
      isRunning: boolean;  // Check if Ollama is accessible
    };
  };
}
```

---

### `ai-provider:switch`

Switch between configured AI providers.

**Request**:

```typescript
{
  provider: "openai" | "ollama";
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "PROVIDER_NOT_CONFIGURED" | "PROVIDER_UNAVAILABLE";
  data?: {
    activeProvider: string;
  };
}
```

**Validation**:

- Target provider must be configured before switching
- For Ollama: verify service is running before switching

---

### `ai-provider:test-connection`

Test connection to configured AI provider.

**Request**:

```typescript
{
  provider: "openai" | "ollama";
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "CONNECTION_FAILED" | "AUTH_FAILED" | "TIMEOUT";
  data?: {
    available: boolean;
    latency: number;  // in milliseconds
    models?: string[];  // Available models
  };
}
```

---

## AI Analysis Handlers

### `ai-analysis:generate-summary`

Generate AI summary for a specification document.

**Request**:

```typescript
{
  featureId: number;
  filePath: string; // Relative path from project root
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FEATURE_NOT_FOUND" | "FILE_NOT_FOUND" | "AI_ERROR" | "RATE_LIMIT";
  data?: {
    requestId: string;
    summary: string;
    tokenCount: number;
    duration: number;
  };
}
```

**Processing**:

- Read and parse markdown file
- Send to configured AI provider with summary prompt
- Cache result in database
- Return formatted summary

---

### `ai-analysis:check-consistency`

Check consistency across multiple specification documents.

**Request**:

```typescript
{
  featureId: number;
  files: string[];  // Array of file paths to compare
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FEATURE_NOT_FOUND" | "FILES_NOT_FOUND" | "AI_ERROR";
  data?: {
    requestId: string;
    discrepancies: Discrepancy[];
    overallConsistency: number;  // 0-100 percentage
    duration: number;
  };
}

interface Discrepancy {
  type: "missing" | "mismatch" | "extra";
  file1: string;
  file2: string;
  section: string;
  description: string;
  severity: "high" | "medium" | "low";
}
```

---

### `ai-analysis:find-gaps`

Identify gaps in specification document.

**Request**:

```typescript
{
  featureId: number;
  filePath: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FEATURE_NOT_FOUND" | "FILE_NOT_FOUND" | "AI_ERROR";
  data?: {
    requestId: string;
    gaps: Gap[];
    completeness: number;  // 0-100 percentage
    duration: number;
  };
}

interface Gap {
  section: string;
  issue: string;
  suggestion: string;
  severity: "critical" | "important" | "minor";
}
```

---

### `ai-analysis:get-history`

Retrieve analysis history for a feature.

**Request**:

```typescript
{
  featureId: number;
  analysisType?: "summary" | "consistency" | "gaps";  // Optional filter
  limit?: number;  // Default: 10
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FEATURE_NOT_FOUND";
  data?: {
    analyses: AnalysisRecord[];
  };
}

interface AnalysisRecord {
  id: number;
  requestId: string;
  analysisType: string;
  createdAt: number;
  duration: number;
  tokenCount: number | null;
  preview: string;  // First 200 chars of result
}
```

---

### `ai-analysis:get-result`

Retrieve full analysis result by ID.

**Request**:

```typescript
{
  requestId: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "NOT_FOUND";
  data?: {
    requestId: string;
    featureId: number;
    analysisType: string;
    content: any;  // Varies by analysis type
    tokenCount: number | null;
    duration: number;
    createdAt: number;
  };
}
```

---

## Schema Visualization Handlers

### `schema:generate`

Generate entity relationship schema from feature specification.

**Request**:

```typescript
{
  featureId: number;
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FEATURE_NOT_FOUND" | "NO_ENTITIES" | "PARSE_ERROR";
  data?: {
    nodes: SchemaNode[];
    edges: SchemaEdge[];
    metadata: {
      entityCount: number;
      relationshipCount: number;
      generatedAt: number;
    };
  };
}

interface SchemaNode {
  id: string;
  type: "entity";
  position: { x: number; y: number };
  data: {
    entityName: string;
    description: string;
    attributeCount: number;
    relationshipCount: number;
  };
}

interface SchemaEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  label: string | null;
  animated: boolean;
}
```

**Processing**:

- Query entities from database for feature
- Generate graph layout using dagre
- Return nodes and edges for ReactFlow

---

### `schema:get-entity-details`

Get detailed information about a specific entity.

**Request**:

```typescript
{
  entityId: number;
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "NOT_FOUND";
  data?: {
    entity: {
      id: number;
      entityName: string;
      description: string;
      attributes: Attribute[];
      relationships: Relationship[];
      sourceFile: string;
      lineNumber: number | null;
    };
  };
}

interface Attribute {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
}

interface Relationship {
  type: "one-to-one" | "one-to-many" | "many-to-many";
  target: string;
  description?: string;
}
```

---

## File Content Handlers

### `files:read-spec`

Read and parse specification file content.

**Request**:

```typescript
{
  featureId: number;
  fileType: "spec" | "plan" | "tasks" | "data-model";
}
```

**Response**:

```typescript
{
  success: boolean;
  error?: string;
  code?: "FILE_NOT_FOUND" | "PARSE_ERROR";
  data?: {
    content: string;  // Raw markdown
    sections: Section[];
    metadata: {
      title: string;
      status: string;
      created: string;
    };
  };
}

interface Section {
  heading: string;
  level: number;
  content: string;
  lineStart: number;
  lineEnd: number;
}
```

---

## Error Codes Summary

| Code                      | Description                     | User Action                    |
| ------------------------- | ------------------------------- | ------------------------------ |
| `VALIDATION_ERROR`        | Invalid input parameters        | Check request format           |
| `FEATURE_NOT_FOUND`       | Feature ID doesn't exist        | Verify feature exists          |
| `FILE_NOT_FOUND`          | Specified file doesn't exist    | Check file path                |
| `PROVIDER_NOT_CONFIGURED` | AI provider not set up          | Configure provider in settings |
| `PROVIDER_UNAVAILABLE`    | Provider service not accessible | Check network/Ollama status    |
| `AUTH_FAILED`             | API key invalid                 | Update API key in settings     |
| `RATE_LIMIT`              | API rate limit exceeded         | Wait or upgrade plan           |
| `AI_ERROR`                | General AI provider error       | Check connection, retry        |
| `PARSE_ERROR`             | Markdown parsing failed         | Fix file syntax                |
| `NO_ENTITIES`             | No entities found in spec       | Add Key Entities section       |
| `TIMEOUT`                 | Request exceeded timeout        | Retry or check connection      |

---

## Integration Notes

1. **Preload API**: Add type-safe wrappers in `electron/preload.ts`
2. **Renderer Types**: Export TypeScript interfaces to `src/types/ai.ts` and
   `src/types/schema.ts`
3. **Error Handling**: Use existing error boundary pattern from
   `ipc-handlers.ts`
4. **Streaming**: For AI analysis, consider WebSocket or chunked responses for
   progress updates (future enhancement)

# Quick Start Guide: AI SDK & Schema Visualization

**Feature**:
[001-speckit-ai-visualization](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/spec.md)\
**Audience**: Developers implementing this feature\
**Created**: 2025-12-29

## Development Setup

### Dependencies Installation

Add new dependencies to `package.json`:

```bash
npm install ai @ai-sdk/openai node-fetch@2
npm install -D @types/node-fetch
```

**Packages**:

- `ai` - Vercel AI SDK core (provider abstraction, streaming)
- `@ai-sdk/openai` - OpenAI provider for AI SDK
- `node-fetch@2` - HTTP client for Ollama integration (v2 for CommonJS
  compatibility)

### Environment Configuration

No `.env` file needed - all configuration stored in electron-store:

- Location: `~/Library/Application Support/speckit-dash/config.json` (macOS)
- API keys encrypted using electron's `safeStorage` API
- Configuration UI in app settings (no manual editing required)

---

## Architecture Overview

### Component Layers

```
┌─────────────────────────────────────────────┐
│           Renderer Process (React)          │
│  - Settings UI (provider config)            │
│  - Analysis views (summary, gaps)           │
│  - Schema visualization (ReactFlow)         │
└──────────────────┬──────────────────────────┘
                   │ IPC calls via preload API
┌──────────────────▼──────────────────────────┐
│           Main Process (Electron)           │
│  - AI Provider Service                      │
│  - Analysis orchestration                   │
│  - Entity relationship parser               │
│  - Database service (enhanced)              │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴─────────┐
          │                  │
┌─────────▼───────┐  ┌──────▼───────────┐
│  OpenAI API     │  │  Ollama (local)  │
│  (cloud)        │  │  :11434/api      │
└─────────────────┘  └──────────────────┘
```

### File Structure

```
electron/services/
├── ai-provider.ts          # NEW: AI SDK provider management
├── ollama-provider.ts      # NEW: Custom Ollama provider
├── analysis-service.ts     # NEW: AI analysis orchestration
└── parser/
    └── entity-relationship-parser.ts  # NEW: Schema extraction

src/
├── views/
│   ├── AIAnalysis/         # NEW: AI analysis UI
│   └── SchemaView/         # NEW: Entity visualization
├── components/
│   └── AISettings/         # NEW: Provider configuration
└── types/
    ├── ai.ts               # NEW: AI-related types
    └── schema.ts           # NEW: Schema types

specs/001-speckit-ai-visualization/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md           # This file
└── contracts/
    └── ipc-handlers.md
```

---

## Key Implementation Patterns

### 1. AI Provider Service Pattern

**File**: `electron/services/ai-provider.ts`

**Responsibilities**:

- Load provider config from electron-store
- Initialize AI SDK with selected provider
- Manage provider switching
- Handle API key encryption/decryption

**Key Methods**:

```typescript
class AIProviderService {
  async getActiveProvider(): Promise<LanguageModel>;
  async configureOpenAI(config: OpenAIConfig): Promise<void>;
  async configureOllama(config: OllamaConfig): Promise<void>;
  async switchProvider(provider: string): Promise<void>;
  async testConnection(provider: string): Promise<boolean>;
}
```

### 2. Custom Ollama Provider Pattern

**File**: `electron/services/ollama-provider.ts`

**Implementation**: Implement `LanguageModelV1` interface from AI SDK

**Key Methods**:

```typescript
class OllamaProvider implements LanguageModelV1 {
  async doGenerate(options): Promise<GenerateResult>;
  async doStream(options): Promise<StreamResult>;
  // Ollama HTTP API integration
}
```

### 3. Analysis Service Pattern

**File**: `electron/services/analysis-service.ts`

**Responsibilities**:

- Orchestrate AI analysis workflows
- Manage analysis request lifecycle
- Cache results in database
- Stream progress updates (optional)

**Key Methods**:

```typescript
class AnalysisService {
  async generateSummary(featureId, filePath): Promise<string>;
  async checkConsistency(featureId, files): Promise<Discrepancy[]>;
  async findGaps(featureId, filePath): Promise<Gap[]>;
  async getAnalysisHistory(featureId): Promise<AnalysisRecord[]>;
}
```

### 4. Schema Visualization Pattern

**Component**: `src/views/SchemaView/index.tsx`

**Libraries**: ReactFlow + dagre for layout

**Implementation**:

```typescript
// Load entities from IPC
const { nodes, edges } = await window.electronAPI.generateSchema(featureId);

// Configure ReactFlow
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodeClick={handleNodeClick}
  fitView
>
  <Controls />
  <Background />
</ReactFlow>;
```

---

## Testing Strategy

### Unit Tests

**Framework**: Vitest

```bash
npm run test
```

**Test Files**:

- `electron/services/__tests__/ai-provider.test.ts`
- `electron/services/__tests__/ollama-provider.test.ts`
- `electron/services/__tests__/analysis-service.test.ts`
- `electron/services/parser/__tests__/entity-relationship-parser.test.ts`

**Mock Strategy**:

- Mock AI SDK responses
- Mock file system for parser tests
- Mock database for service tests

### Integration Tests

**Scenarios**:

1. End-to-end AI analysis flow (mock AI responses)
2. Provider switching without data loss
3. Schema generation from real spec files

**Location**: `tests/integration/ai-sdk-integration.test.ts`

### E2E Tests

**Framework**: Playwright

```bash
npm run test:e2e
```

**Scenarios**:

1. Configure OpenAI provider → run summary analysis
2. Switch to Ollama → verify analysis still works
3. View schema visualization → click node → see details
4. Error handling: invalid API key, Ollama offline

**Location**: `tests/e2e/ai-visualization.spec.ts`

---

## Development Workflow

### Phase 1: AI Provider Infrastructure (P1 - Core)

1. **Create AI provider service** (`ai-provider.ts`)
   - electron-store integration
   - safeStorage for API key encryption
   - Provider initialization

2. **Create custom Ollama provider** (`ollama-provider.ts`)
   - Implement `LanguageModelV1` interface
   - HTTP client for Ollama API
   - Error handling

3. **Add IPC handlers** (extend `ipc-handlers.ts`)
   - `ai-provider:configure`
   - `ai-provider:get-config`
   - `ai-provider:switch`
   - `ai-provider:test-connection`

4. **Create settings UI** (`src/components/AISettings`)
   - Provider selection (OpenAI/Ollama)
   - API key input (OpenAI)
   - Endpoint configuration (Ollama)
   - Connection test button

**Verification**: Can configure both providers, switch between them, see current
config

---

### Phase 2: AI Analysis Features (P2 - Value-add)

1. **Create analysis service** (`analysis-service.ts`)
   - Summary generation with prompt templates
   - Consistency checking logic
   - Gap analysis logic
   - Result caching

2. **Add analysis IPC handlers**
   - `ai-analysis:generate-summary`
   - `ai-analysis:check-consistency`
   - `ai-analysis:find-gaps`
   - `ai-analysis:get-history`

3. **Create analysis UI** (`src/views/AIAnalysis`)
   - Analysis type selector
   - Trigger buttons
   - Loading states
   - Result display

4. **Database enhancements**
   - Create `analysis_results` table
   - Add migration script

**Verification**: Run each analysis type, verify results stored, reload and see
history

---

### Phase 3: Schema Visualization (P3 - Enhancement)

1. **Create entity-relationship parser** (`entity-relationship-parser.ts`)
   - Extract entities from "Key Entities" sections
   - Parse relationships from descriptions
   - Enhance existing entity records

2. **Add schema IPC handlers**
   - `schema:generate`
   - `schema:get-entity-details`

3. **Create schema visualization** (`src/views/SchemaView`)
   - ReactFlow setup
   - Dagre layout integration
   - Custom node rendering
   - Entity detail panel

4. **Database enhancements**
   - Add `source_file` and `line_number` to entities table

**Verification**: Open schema view, see entities as nodes, click node to see
details

---

## Common Issues & Solutions

### Issue: Ollama connection fails

**Symptoms**: "Ollama is not running" error

**Solution**:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve
```

### Issue: OpenAI API key not persisting

**Solution**: Check electron's safeStorage availability:

```typescript
import { safeStorage } from "electron";
if (!safeStorage.isEncryptionAvailable()) {
  // Fall back to storing encrypted with less secure method
}
```

### Issue: ReactFlow layout overlapping nodes

**Solution**: Adjust dagre layout parameters in schema generation:

```typescript
const layoutOptions = {
  rankdir: "TB",
  nodesep: 100, // Increase horizontal spacing
  ranksep: 80, // Increase vertical spacing
};
```

### Issue: AI analysis timeout

**Solution**: Increase timeout in Ollama config or add progress streaming

---

## Performance Benchmarks

**Target metrics (from Success Criteria)**:

| Operation        | Target  | How to Measure                              |
| ---------------- | ------- | ------------------------------------------- |
| Load project     | < 3s    | Time from path entry to file list displayed |
| Parse spec file  | < 100ms | Parser execution time for 5000 lines        |
| Generate summary | < 10s   | End-to-end including AI API call            |
| Render schema    | < 500ms | ReactFlow initial render for 20 entities    |

**Monitoring**: Add performance logging in key services:

```typescript
console.time('generate-summary');
const summary = await generateSummary(...);
console.timeEnd('generate-summary');
```

---

## Next Steps

After completing implementation in this order:

1. **Run all tests**: `npm run test && npm run test:e2e`
2. **Manual verification**: Follow acceptance scenarios from spec.md
3. **Performance check**: Verify against success criteria benchmarks
4. **Documentation**: Update user-facing docs in app
5. **Deployment**: Package for target platforms

---

## References

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [ReactFlow Docs](https://reactflow.dev/)
- [Dagre Layout](https://github.com/dagrejs/dagre/wiki)

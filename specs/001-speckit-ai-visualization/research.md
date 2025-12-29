# Research & Design Decisions

**Feature**:
[001-speckit-ai-visualization](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/spec.md)\
**Created**: 2025-12-29\
**Purpose**: Document research findings and technology decisions for AI SDK
integration and schema visualization

## Phase 0: Research Findings

### 1. AI SDK Integration Strategy

**Decision**: Use Vercel AI SDK v3.x as abstraction layer

**Rationale**:

- Provides unified interface for multiple AI providers (OpenAI, Anthropic,
  custom providers)
- Built-in streaming support for real-time AI responses
- Type-safe with TypeScript
- Well-documented with active community
- Supports custom providers for Ollama integration
- Lightweight footprint (~50KB core)

**Alternatives Considered**:

- **LangChain**: More complex, heavier dependency footprint, over-engineered for
  our needs
- **Direct API integration**: No abstraction, would require separate
  implementations for OpenAI and Ollama
- **@ai-sdk/openai + custom Ollama**: Vercel AI SDK supports this pattern
  natively

**Implementation Approach**:

- Install `ai` package (Vercel AI SDK core)
- Install `@ai-sdk/openai` for OpenAI provider
- Create custom Ollama provider using AI SDK's `LanguageModelV1` interface
- Store provider configuration in electron-store (already in use)
- Create service layer in `electron/services/ai-provider.ts` for provider
  management

### 2. Ollama Integration Pattern

**Decision**: Implement Ollama as custom AI SDK provider using HTTP REST API

**Rationale**:

- Ollama exposes OpenAI-compatible REST API on `http://localhost:11434`
- AI SDK provides `LanguageModelV1` interface for custom providers
- Can reuse streaming and error handling from AI SDK core
- No need for additional Ollama-specific client libraries

**API Endpoints**:

- `GET /api/tags` - List available models
- `POST /api/generate` - Generate completion
- `POST /api/chat` - Chat completion (OpenAI compatible)

**Error Handling**:

- Check if Ollama is running before requests
- Provide clear user guidance when Ollama is not available
- Graceful fallback messaging with setup instructions

### 3. AI Analysis Prompts Design

**Decision**: Create specialized prompt templates for each analysis type

**Analysis Types**:

1. **Document Summarization**:
   - Input: Full markdown content
   - Output: 2-3 paragraph summary with key points
   - Model: Faster models (GPT-3.5-turbo, llama2:7b)

2. **Consistency Checking**:
   - Input: Multiple spec files (spec.md, plan.md, tasks.md)
   - Output: List of discrepancies with file references
   - Model: More capable models (GPT-4, mixtral)

3. **Gap Analysis**:
   - Input: Single specification file
   - Output: Missing sections, incomplete requirements, unclear criteria
   - Model: Mid-tier models (GPT-3.5-turbo, llama2:13b)

**Prompt Engineering Strategy**:

- Use structured output format (JSON) for consistency checks and gap analysis
- Include examples in system prompts (few-shot learning)
- Set temperature=0.3 for consistent, factual responses
- Use max_tokens limits appropriate to expected output length

### 4. Schema Visualization Library

**Decision**: Use ReactFlow (already installed) for entity relationship diagrams

**Rationale**:

- Already in package.json dependencies
- Excellent React integration with hooks
- Supports custom node rendering
- Built-in zoom, pan, and layout controls
- Active development and community
- Automatic layout with dagre integration (also already installed)

**Layout Algorithm**:

- Use dagre for hierarchical layout of entity nodes
- Direction: Top-to-bottom (TB) for clear relationship flow
- Node spacing: 100px horizontal, 80px vertical
- Edge routing: Bezier curves for clean appearance

**Node Design**:

- Custom node component showing entity name, attributes, description
- Color coding by entity type or relationship count
- Interactive: click to show full details in side panel
- Hover: highlight connected relationships

### 5. Markdown Parsing Enhancement

**Decision**: Extend existing remark-based parsers for AI analysis needs

**Current State**:

- Existing parsers: `spec-parser.ts`, `plan-parser.ts`, `tasks-parser.ts`,
  `data-model-parser.ts`
- Already using `remark`, `remark-parse`, `remark-gfm`, `unified`
- Parser output stored in SQLite database

**Enhancements Needed**:

- Extract full section content (not just metadata) for AI analysis
- Parse entity definitions from "Key Entities" sections
- Extract relationship keywords (e.g., "has many", "belongs to", "references")
- Support frontmatter extraction for metadata

**New Parser**:

- `entity-relationship-parser.ts` - Dedicated parser for schema extraction
- Input: Markdown AST from remark
- Output: Structured entity array with attributes and relationships

### 6. Configuration Storage

**Decision**: Use electron-store (already in use) for AI provider settings

**Storage Schema**:

```json
{
  "aiProvider": {
    "activeProvider": "openai" | "ollama",
    "openai": {
      "apiKey": "encrypted-key",
      "model": "gpt-3.5-turbo",
      "baseURL": "https://api.openai.com/v1"
    },
    "ollama": {
      "baseURL": "http://localhost:11434",
      "model": "llama2"
    }
  }
}
```

**Security**:

- Use electron's `safeStorage` API to encrypt OpenAI API keys
- Store encrypted values in electron-store
- Never expose API keys to renderer process
- All AI requests handled in main process

### 7. Caching Strategy

**Decision**: Implement two-tier caching for parsed data and AI results

**Tier 1: Database Cache (SQLite)**

- Already exists for features, tasks, entities
- Add tables for AI analysis results
- Invalidate on file changes (tracked by file-watcher service)

**Tier 2: In-Memory Cache (Main Process)**

- Cache parsed markdown AST for current session
- Cache entity relationship graphs
- Clear on file watcher events
- Max age: 5 minutes

**Benefits**:

- Reduces file I/O operations
- Avoids redundant AI API calls
- Fast navigation between views

### 8. Performance Optimization

**Decision**: Implement progressive loading and virtualization

**Strategies**:

1. **File Discovery**:
   - Load and parse files on-demand
   - Show file list immediately, parse content when viewed

2. **Schema Visualization**:
   - Use ReactFlow's viewport rendering (automatic)
   - Limit initial render to 50 entities max
   - Pagination or filtering for larger schemas

3. **AI Analysis**:
   - Show loading states with progress indicators
   - Stream AI responses for real-time feedback
   - Cancel in-flight requests on navigation

**Performance Budgets**:

- File discovery: < 1 second for 50 files
- Single file parse: < 100ms for 5000 lines
- Schema render: < 500ms for 20 entities
- AI summary generation: < 10 seconds (as per success criteria)

### 9. Error Handling Patterns

**Decision**: Implement consistent error boundaries and user messaging

**Error Categories**:

1. **File System Errors**:
   - Permission denied → "Please check file permissions"
   - Path not found → "Project path does not exist"
   - Malformed markdown → "File contains syntax errors: [details]"

2. **AI Provider Errors**:
   - API key invalid → "Please check your OpenAI API key in settings"
   - Rate limit → "Rate limit exceeded. Try again in [time]"
   - Timeout → "Request timed out. Check your connection"
   - Ollama not running → "Ollama is not running. Start Ollama or switch to
     OpenAI"

3. **Database Errors**:
   - Already handled by existing error boundaries in IPC handlers
   - Extend with AI-specific error codes

**User Experience**:

- Toast notifications for non-critical errors
- Modal dialogs for critical errors requiring user action
- Inline error messages in forms and settings
- Retry buttons where applicable

### 10. Testing Strategy

**Decision**: Implement unit, integration, and E2E tests following constitution

**Test Coverage Plan**:

1. **Unit Tests** (target: 80%):
   - AI provider service: mock API calls, test error handling
   - Entity relationship parser: test markdown to schema transformation
   - Prompt templates: verify template interpolation

2. **Integration Tests**:
   - AI SDK + custom Ollama provider integration
   - Parser + database storage flow
   - Schema visualization rendering with sample data

3. **E2E Tests** (using Playwright):
   - Complete user flow: configure project → view schema → run AI analysis
   - Provider switching (OpenAI ↔ Ollama)
   - Error scenarios (invalid API key, offline Ollama)

**Test Frameworks** (already configured):

- Vitest for unit/integration tests
- Playwright for E2E tests
- @testing-library/react for component tests

## Summary

All technology decisions leverage existing infrastructure where possible:

- Extend current markdown parsers instead of replacing
- Use installed visualization libraries (ReactFlow, Recharts)
- Follow established patterns (IPC handlers, database service)
- Maintain consistency with constitution requirements

No "NEEDS CLARIFICATION" items remain. All decisions made with clear rationale
based on project constraints and success criteria.

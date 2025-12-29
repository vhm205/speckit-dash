# Implementation Plan: Spec-kit Data Visualization with AI SDK Integration

**Branch**: `001-speckit-ai-visualization` | **Date**: 2025-12-29 | **Spec**:
[spec.md](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/spec.md)\
**Input**: Feature specification from
`/specs/001-speckit-ai-visualization/spec.md`

## Summary

This feature integrates AI capabilities (OpenAI and Ollama) into the Spec-kit
dashboard for analyzing specification documents and adds interactive schema
visualization of entity relationships. Users will be able to configure AI
providers, generate summaries, check consistency across documents, identify
gaps, and view entity diagrams.

**Technical Approach** (from
[research.md](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/research.md)):

- Use Vercel AI SDK v3.x as abstraction layer for multiple AI providers
- Implement custom Ollama provider using AI SDK's `LanguageModelV1` interface
- Extend existing remark-based markdown parsers for entity extraction
- Use ReactFlow (already installed) for interactive schema diagrams with dagre
  layout
- Store provider configuration in electron-store with encrypted API keys
- Implement two-tier caching (database + in-memory) for performance
- Add 12 new IPC handlers for AI operations and schema generation

## Technical Context

**Language/Version**: TypeScript 5.3+ / Node.js 20+ (Electron 28)\
**Primary Dependencies**:

- Existing: Electron, React 18, TypeScript, electron-store, better-sqlite3,
  remark/unified, reactflow, dagre
- New: `ai` (Vercel AI SDK core), `@ai-sdk/openai`, `node-fetch@2`

**Storage**:

- SQLite database (already in use) - add `analysis_results` table, enhance
  `entities` table
- electron-store (already in use) - AI provider configuration with encrypted
  keys
- In-memory cache (main process) - parsed schemas and AI results (5-min TTL)

**Testing**: Vitest (unit/integration), Playwright (E2E), @testing-library/react
(components)

**Target Platform**: Electron desktop app (macOS/Windows/Linux)

**Project Type**: Electron application (main process + renderer process with
React frontend)

**Performance Goals** (from Success Criteria):

- Project load: < 3 seconds for 50 spec files
- File parsing: < 100ms per 5000 lines
- AI summary: < 10 seconds for 5000 words
- Schema rendering: < 500ms for 20 entities
- Navigation: no page reloads or delays

**Constraints**:

- Offline support: basic visualization without AI (AI requires network/Ollama)
- Security: API keys must be encrypted using electron's safeStorage
- Privacy: All AI requests processed in main process, no key exposure to
  renderer
- Compatibility: Must work with existing database schema and IPC patterns

**Scale/Scope**:

- Support up to 50 specification files per project
- Handle entities: up to 100 entities per schema diagram
- AI analysis: support documents up to 10,000 lines

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Initial Check (Pre-Research)

✅ **PASS** - All principles addressed in planning phase

### Post-Design Check

- **I. Code Quality Standards**: ✅ **PASS**
  - TypeScript strict mode enabled in tsconfig.json
  - All new services will include JSDoc documentation
  - AI provider service uses SOLID principles (single responsibility, interface
    abstraction)
  - Code style follows existing ESLint configuration (.eslintrc.cjs)
  - Complexity justified: Custom Ollama provider needed for local AI support (no
    simpler alternative)

- **II. Testing Discipline**: ✅ **PASS**
  - Unit tests defined for 5 services (target 80% coverage):
    - ai-provider.ts, ollama-provider.ts, analysis-service.ts,
      entity-relationship-parser.ts, schema generation
  - Integration tests: AI SDK + providers, parser + database, schema rendering
  - E2E tests using Playwright: full user flows (configure → analyze →
    visualize)
  - Contract tests: IPC handler request/response validation
  - All tests documented in
    [quickstart.md](file:///Users/moment/Projects/personal/projects/saas/speckit-dash/specs/001-speckit-ai-visualization/quickstart.md)
    Testing Strategy section

- **III. User Experience Consistency**: ✅ **PASS**
  - Settings UI will use existing Preline UI components (already in
    package.json)
  - Loading states with existing LoadingSpinner component pattern
  - Error messages follow existing error boundary pattern from ipc-handlers.ts
  - Settings UI will match existing ProjectConfigModal patterns
  - Accessibility: keyboard navigation for ReactFlow diagram, ARIA labels for
    analysis buttons
  - UX validation: All acceptance scenarios from spec.md will be manually tested

- **IV. Performance Requirements**: ✅ **PASS**
  - Latency budgets defined in Success Criteria (SC-001 through SC-010)
  - Two-tier caching strategy documented in research.md section 7
  - Progressive loading: files parsed on-demand, not all at once
  - ReactFlow viewport rendering handles large schemas automatically
  - Performance benchmarking planned in quickstart.md
  - Resource monitoring: AI request streaming for long operations
  - Database indexes planned on analysis_results table (feature_id,
    analysis_type)

**Overall**: ✅ **PASS** - All constitutional principles satisfied with
documented strategies

## Project Structure

### Documentation (this feature)

```text
specs/001-speckit-ai-visualization/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (implementation plan)
├── research.md          # Technology decisions and rationale (completed)
├── data-model.md        # Entity definitions and database schema (completed)
├── quickstart.md        # Developer setup and workflow guide (completed)
├── contracts/           # API contracts (completed)
│   └── ipc-handlers.md  # IPC handler definitions
└── checklists/          # Quality validation (completed)
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

**Structure Decision**: Electron application structure - main process services +
React renderer components. This feature adds new services to Electron main
process and new views to React frontend, following the existing architecture
pattern.

```text
electron/
├── main.ts                    # [EXISTS] Main process entry point
├── preload.ts                 # [MODIFY] Add AI & schema IPC wrappers
├── services/
│   ├── ai-provider.ts         # [NEW] AI provider management service
│   ├── ollama-provider.ts     # [NEW] Custom Ollama AI SDK provider
│   ├── analysis-service.ts    # [NEW] AI analysis orchestration
│   ├── database.ts            # [MODIFY] Add analysis_results table and queries
│   ├── ipc-handlers.ts        # [MODIFY] Add 12 new IPC handlers
│   └── parser/
│       ├── spec-parser.ts     # [EXISTS] Current spec parser
│       ├── plan-parser.ts     # [EXISTS] Current plan parser
│       ├── tasks-parser.ts    # [EXISTS] Current tasks parser
│       ├── data-model-parser.ts  # [EXISTS] Current data model parser
│       └── entity-relationship-parser.ts  # [NEW] Enhanced entity extraction
└── utils/
    └── encryption.ts          # [NEW] API key encryption helpers

src/
├── App.tsx                    # [MODIFY] Add new routes for AI views
├── components/
│   ├── AISettings/            # [NEW] AI provider configuration UI
│   │   ├── index.tsx
│   │   ├── OpenAIConfig.tsx
│   │   ├── OllamaConfig.tsx
│   │   └── ConnectionTest.tsx
│   └── ui/                    # [EXISTS] Shared UI components (Preline)
├── views/
│   ├── AIAnalysis/            # [NEW] AI analysis features UI
│   │   ├── index.tsx
│   │   ├── SummaryView.tsx
│   │   ├── ConsistencyView.tsx
│   │   ├── GapAnalysisView.tsx
│   │   └── AnalysisHistory.tsx
│   ├── SchemaView/            # [NEW] Entity relationship visualization
│   │   ├── index.tsx
│   │   ├── SchemaGraph.tsx    # ReactFlow component
│   │   ├── EntityNode.tsx     # Custom node component
│   │   └── EntityDetails.tsx  # Side panel with entity info
│   ├── StatsOverview/         # [EXISTS] Current dashboard view
│   └── FeatureList/           # [EXISTS] Current feature list
├── contexts/
│   └── AIProviderContext.tsx  # [NEW] AI provider state management
├── hooks/
│   ├── useAIAnalysis.ts       # [NEW] AI analysis hook
│   └── useSchema.ts           # [NEW] Schema generation hook
└── types/
    ├── ai.ts                  # [NEW] AI-related TypeScript types
    ├── schema.ts              # [NEW] Schema visualization types
    └── index.ts               # [MODIFY] Export new types

tests/
├── unit/
│   └── electron/
│       └── services/
│           ├── ai-provider.test.ts       # [NEW] AI provider tests
│           ├── ollama-provider.test.ts   # [NEW] Ollama provider tests
│           ├── analysis-service.test.ts  # [NEW] Analysis service tests
│           └── parser/
│               └── entity-relationship-parser.test.ts  # [NEW] Parser tests
├── integration/
│   ├── ai-sdk-integration.test.ts        # [NEW] AI SDK integration tests
│   └── schema-generation.test.ts         # [NEW] Schema generation tests
└── e2e/
    └── ai-visualization.spec.ts          # [NEW] E2E tests (Playwright)
```

**Key File Modifications**:

- `electron/preload.ts`: Add ~12 new IPC method wrappers (typed)
- `electron/services/database.ts`: Add `analysis_results` table, enhance
  `entities` table
- `electron/services/ipc-handlers.ts`: Add 12 new handlers (~400 lines)
- `src/App.tsx`: Add routes for `/ai-analysis` and `/schema-view`
- `package.json`: Add 3 new dependencies (ai, @ai-sdk/openai, node-fetch@2)

**Migration Required**: Database migration script for `analysis_results` table
creation and `entities` table enhancement (add `source_file`, `line_number`
columns)

## Complexity Tracking

> **No constitutional violations requiring justification.**

All architectural decisions align with constitution principles:

- Code quality maintained through TypeScript strict mode and documentation
- Testing strategy meets 80% coverage target with unit/integration/E2E tests
- UX consistency ensured by reusing existing Preline UI components
- Performance requirements satisfied via caching and progressive loading

No additional complexity beyond necessary feature requirements.

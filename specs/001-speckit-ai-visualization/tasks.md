# Tasks: Spec-kit Data Visualization with AI SDK Integration

**Input**: Design documents from `/specs/001-speckit-ai-visualization/`\
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/ipc-handlers.md,
research.md, quickstart.md

**Tests**: Not explicitly requested in specification - focusing on
implementation tasks. Testing strategy documented in quickstart.md for
post-implementation.

**Organization**: Tasks grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Electron main process**: `electron/services/`, `electron/utils/`
- **React renderer**: `src/components/`, `src/views/`, `src/contexts/`,
  `src/hooks/`, `src/types/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Paths follow Electron application structure from plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare project for feature development

- [x] T001 Install new npm dependencies: ai, @ai-sdk/openai, node-fetch@2 per
      quickstart.md
- [x] T002 [P] Install dev dependencies: @types/node-fetch per quickstart.md
- [x] T003 [P] Create database migration script for analysis_results table in
      electron/migrations/
- [x] T004 [P] Create TypeScript types for AI SDK in src/types/ai.ts
- [x] T005 [P] Create TypeScript types for schema visualization in
      src/types/schema.ts
- [x] T006 Update src/types/index.ts to export new ai.ts and schema.ts types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Run database migration to create analysis_results table with indexes
- [x] T008 [P] Enhance entities table schema: add source_file and line_number
      columns
- [x] T009 [P] Create encryption utility for API keys in
      electron/utils/encryption.ts
- [x] T010 [P] Update electron/preload.ts: add type definitions for 12 new IPC
      handlers
- [x] T011 Update electron/services/database.ts: add queries for
      analysis_results table
- [x] T012 Update electron/services/database.ts: add queries for enhanced
      entities table

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Load and Display Spec-kit Project (Priority: P1) 🎯 MVP

**Goal**: Users can enter a Spec-kit project path and immediately see all
specification files with their metadata, sections, and relationships visualized
in an organized dashboard.

**Independent Test**: Enter a valid Spec-kit project path → verify all files
(spec.md, plan.md, tasks.md) are discovered, parsed, and displayed with metadata
→ navigate between documents and sections → validate error message for invalid
paths.

### Implementation for User Story 1

**Note**: This story builds on existing file discovery and parsing
infrastructure already in the codebase. Focus is on ensuring completeness of
file visualization.

- [x] T013 [P] [US1] Verify existing file discovery logic in
      electron/services/feature-sync.ts handles all spec file types
- [x] T014 [P] [US1] Enhance existing parsers if needed to extract section-level
      metadata for navigation
- [x] T015 [US1] Update src/views/FeatureList/index.tsx to display enhanced file
      metadata
- [x] T016 [US1] Add section navigation view component in
      src/components/SectionNavigator/index.tsx
- [x] T017 [US1] Integrate section navigator into feature detail view
- [x] T018 [US1] Add error handling UI for invalid project paths in
      src/components/ErrorDisplay.tsx
- [x] T019 [US1] Update project configuration modal to validate Spec-kit
      structure before acceptance

**Checkpoint**: At this point, User Story 1 should be fully functional -
complete file visualization with navigation

---

## Phase 4: User Story 2 - AI-Powered Insights and Analysis (Priority: P2)

**Goal**: Users can configure AI providers (OpenAI or Ollama), generate document
summaries, check consistency across specs, and identify gaps - with clear setup
guidance when providers aren't configured.

**Independent Test**: Configure OpenAI provider → load project → request summary
for spec.md → verify AI summary appears → switch to Ollama → verify it works →
trigger consistency check across spec/plan/tasks → verify discrepancies shown →
test gap analysis → verify missing sections highlighted.

### Implementation for User Story 2

#### AI Provider Infrastructure

- [x] T020 [P] [US2] Create AIProviderService class in
      electron/services/ai-provider.ts
- [x] T021 [P] [US2] Implement OpenAI provider initialization using
      @ai-sdk/openai
- [x] T022 [P] [US2] Create custom OllamaProvider class in
      electron/services/ollama-provider.ts
- [x] T023 [US2] Implement LanguageModelV1 interface for Ollama (doGenerate,
      doStream methods)
- [x] T024 [US2] Add provider configuration storage in AIProviderService using
      electron-store
- [x] T025 [US2] Implement API key encryption/decryption using
      electron/utils/encryption.ts
- [x] T026 [US2] Add provider switching logic with validation

#### IPC Handlers for AI Provider Configuration

- [x] T027 [P] [US2] Implement ai-provider:configure handler in
      electron/services/ipc-handlers.ts
- [x] T028 [P] [US2] Implement ai-provider:get-config handler in
      electron/services/ipc-handlers.ts
- [x] T029 [P] [US2] Implement ai-provider:switch handler in
      electron/services/ipc-handlers.ts
- [x] T030 [P] [US2] Implement ai-provider:test-connection handler in
      electron/services/ipc-handlers.ts

#### Analysis Service & Prompts

- [x] T031 [US2] Create AnalysisService class in
      electron/services/analysis-service.ts
- [x] T032 [US2] Design and implement summary generation prompt template
- [x] T033 [US2] Design and implement consistency checking prompt template with
      structured JSON output
- [x] T034 [US2] Design and implement gap analysis prompt template with
      structured JSON output
- [x] T035 [US2] Implement generateSummary method with AI SDK integration
- [x] T036 [US2] Implement checkConsistency method for multi-document analysis
- [x] T037 [US2] Implement findGaps method for specification completeness
      checking
- [x] T038 [US2] Add result caching logic to database via analysis_results table
- [x] T039 [US2] Implement in-memory cache for recent analysis results (5-min
      TTL)

#### IPC Handlers for AI Analysis

- [x] T040 [P] [US2] Implement ai-analysis:generate-summary handler in
      electron/services/ipc-handlers.ts
- [x] T041 [P] [US2] Implement ai-analysis:check-consistency handler in
      electron/services/ipc-handlers.ts
- [x] T042 [P] [US2] Implement ai-analysis:find-gaps handler in
      electron/services/ipc-handlers.ts
- [x] T043 [P] [US2] Implement ai-analysis:get-history handler in
      electron/services/ipc-handlers.ts
- [x] T044 [P] [US2] Implement ai-analysis:get-result handler in
      electron/services/ipc-handlers.ts

#### Settings UI

- [x] T045 [P] [US2] Create AISettings component in
      src/components/AISettings/index.tsx
- [x] T046 [P] [US2] Create OpenAIConfig sub-component in
      src/components/AISettings/OpenAIConfig.tsx
- [x] T047 [P] [US2] Create OllamaConfig sub-component in
      src/components/AISettings/OllamaConfig.tsx
- [x] T048 [P] [US2] Create ConnectionTest component in
      src/components/AISettings/ConnectionTest.tsx
- [ ] T049 [US2] Integrate AISettings into app settings/preferences view
- [ ] T050 [US2] Create AIProviderContext in src/contexts/AIProviderContext.tsx
      for state management

#### Analysis UI Views

- [x] T051 [P] [US2] Create AIAnalysis main view in
      src/views/AIAnalysis/index.tsx
- [x] T052 [P] [US2] Create SummaryView component in
      src/views/AIAnalysis/SummaryView.tsx
- [x] T053 [P] [US2] Create ConsistencyView component in
      src/views/AIAnalysis/ConsistencyView.tsx
- [x] T054 [P] [US2] Create GapAnalysisView component in
      src/views/AIAnalysis/GapAnalysisView.tsx
- [x] T055 [P] [US2] Create AnalysisHistory component in
      src/views/AIAnalysis/AnalysisHistory.tsx
- [ ] T056 [US2] Create useAIAnalysis custom hook in src/hooks/useAIAnalysis.ts
- [ ] T057 [US2] Add routes for /ai-analysis in src/App.tsx
- [ ] T058 [US2] Add navigation menu items for AI Analysis views
- [ ] T059 [US2] Implement loading states and error handling UI for all AI
      operations
- [ ] T060 [US2] Add setup guide modal that displays when no AI provider is
      configured

**Checkpoint**: At this point, User Stories 1 AND 2 should both work
independently - full file visualization + AI analysis capabilities

---

## Phase 5: User Story 3 - Interactive Schema Visualization (Priority: P3)

**Goal**: Users can view entity relationship diagrams extracted from
specification files, with interactive nodes showing entity details,
relationships, and source traceability.

**Independent Test**: Open a feature with Key Entities section defined →
navigate to Schema View → verify all entities appear as nodes → verify
relationships shown as edges → click entity node → verify detail panel shows
attributes and relationships → test zoom and pan controls → verify layout
optimizes for readability.

### Implementation for User Story 3

#### Entity Relationship Parser

- [x] T061 [P] [US3] Create entity-relationship-parser.ts in
      electron/services/parser/
- [x] T062 [US3] Implement entity extraction from "Key Entities" markdown
      sections
- [x] T063 [US3] Implement relationship parsing from entity descriptions
- [x] T064 [US3] Add source file and line number tracking to parsed entities
- [x] T065 [US3] Integrate parser into existing feature sync workflow

#### Schema Generation Service

- [x] T066 [US3] Create schema generation logic in
      electron/services/schema-generator.ts
- [x] T067 [US3] Implement dagre layout algorithm for entity positioning
- [x] T068 [US3] Generate ReactFlow node objects from entities
- [x] T069 [US3] Generate ReactFlow edge objects from relationships
- [x] T070 [US3] Add in-memory caching for generated schemas (5-min TTL)

#### IPC Handlers for Schema

- [x] T071 [P] [US3] Implement schema:generate handler in
      electron/services/ipc-handlers.ts
- [x] T072 [P] [US3] Implement schema:get-entity-details handler in
      electron/services/ipc-handlers.ts

#### Schema Visualization UI

- [x] T073 [P] [US3] Create SchemaView main view in
      src/views/SchemaView/index.tsx
- [x] T074 [P] [US3] Create SchemaGraph component in
      src/views/SchemaView/SchemaGraph.tsx
- [x] T075 [P] [US3] Create custom EntityNode component in
      src/views/SchemaView/EntityNode.tsx
- [x] T076 [P] [US3] Create EntityDetails side panel in
      src/views/SchemaView/EntityDetails.tsx
- [ ] T077 [US3] Create useSchema custom hook in src/hooks/useSchema.ts
- [ ] T078 [US3] Configure ReactFlow with zoom, pan, and controls
- [ ] T079 [US3] Add interactive node click handlers to show entity details
- [ ] T080 [US3] Implement relationship edge styling and labels
- [ ] T081 [US3] Add routes for /schema-view in src/App.tsx
- [ ] T082 [US3] Add navigation menu items for Schema View
- [ ] T083 [US3] Add empty state UI when no entities are found
- [ ] T084 [US3] Add loading state for schema generation

**Checkpoint**: All user stories should now be independently functional -
visualization + AI analysis + schema diagrams

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T085 [P] Update GEMINI.md with new technology stack (AI SDK, ReactFlow
      usage patterns)
- [ ] T086 [P] Add JSDoc documentation to all new services
- [ ] T087 Code review: verify TypeScript strict mode compliance across all new
      files
- [ ] T088 Code review: verify error handling follows existing IPC pattern
- [ ] T089 Performance validation: test with 50 spec files per success criteria
      SC-001
- [ ] T090 Performance validation: verify AI summary < 10 seconds per success
      criteria SC-004
- [ ] T091 Performance validation: verify schema render < 500ms per success
      criteria SC-005
- [ ] T092 [P] Add console logging for key AI operations (provider init,
      analysis requests)
- [ ] T093 Security review: verify API keys never exposed to renderer process
- [ ] T094 Accessibility review: keyboard navigation for ReactFlow, ARIA labels
      for buttons
- [ ] T095 Run manual validation against all acceptance scenarios from spec.md
- [ ] T096 Run quickstart.md validation: verify setup instructions work
      end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user
  stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - **US1 (P1)** can start after Phase 2 - No dependencies on other stories
  - **US2 (P2)** can start after Phase 2 - Independent of US1 (though can
    leverage US1 file loading)
  - **US3 (P3)** can start after Phase 2 - Requires entity parser but
    independent of US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No
  dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent,
  but benefits from US1's file loading (soft dependency)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent,
  extracts entities from same files as US1

### Within Each User Story

#### User Story 2 (AI Analysis) Task Order:

1. AI Provider Infrastructure (T020-T026) must complete first
2. IPC handlers for config (T027-T030) can run parallel to infrastructure
   testing
3. Analysis Service (T031-T039) depends on provider infrastructure
4. IPC handlers for analysis (T040-T044) depend on analysis service
5. Settings UI (T045-T050) can run parallel to analysis service
6. Analysis UI (T051-T060) depends on IPC handlers being complete

#### User Story 3 (Schema) Task Order:

1. Entity parser (T061-T065) must complete first
2. Schema generation (T066-T070) depends on parser
3. IPC handlers (T071-T072) depend on schema generation
4. Schema UI (T073-T084) depends on IPC handlers

### Parallel Opportunities

- All Setup tasks (T001-T006) can run in parallel
- All Foundational tasks (T007-T012) can run in parallel within Phase 2
- Once Foundational completes, **all three user stories can start in parallel**
  (if team capacity allows)
- Within US2: Infrastructure tasks (T020-T022, T045-T047) can run in parallel
- Within US2: IPC handlers (T027-T030, T040-T044) can run in parallel once
  dependencies met
- Within US2: UI components (T046-T048, T051-T055) can run in parallel
- Within US3: Parser tasks (T061-T064) can run in parallel
- Within US3: UI components (T073-T076) can run in parallel

---

## Parallel Example: User Story 2 (AI Analysis)

```bash
# After provider infrastructure complete, launch in parallel:
Task T027: "Implement ai-provider:configure handler"
Task T028: "Implement ai-provider:get-config handler"
Task T029: "Implement ai-provider:switch handler"
Task T030: "Implement ai-provider:test-connection handler"

# UI components can be built in parallel:
Task T046: "Create OpenAIConfig sub-component"
Task T047: "Create OllamaConfig sub-component"
Task T048: "Create ConnectionTest component"

Task T051: "Create AIAnalysis main view"
Task T052: "Create SummaryView component"
Task T053: "Create ConsistencyView component"
Task T054: "Create GapAnalysisView component"
Task T055: "Create AnalysisHistory component"
```

---

## Parallel Example: User Story 3 (Schema Visualization)

```bash
# Parser tasks can run in parallel:
Task T061: "Create entity-relationship-parser.ts"
Task T062: "Implement entity extraction from markdown"
Task T063: "Implement relationship parsing"
Task T064: "Add source file tracking"

# UI components can be built in parallel:
Task T073: "Create SchemaView main view"
Task T074: "Create SchemaGraph component"
Task T075: "Create custom EntityNode component"
Task T076: "Create EntityDetails side panel"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T012) - CRITICAL
3. Complete Phase 3: User Story 1 (T013-T019)
4. **STOP and VALIDATE**: Test file discovery, parsing, and visualization
   independently
5. Deploy/demo MVP with complete file visualization

### Incremental Delivery

1. **Foundation**: Setup + Foundational (T001-T012) → Database and types ready
2. **MVP Release**: Add User Story 1 (T013-T019) → Test independently →
   Deploy/Demo\
   _Users can now load and visualize Spec-kit projects_
3. **AI Release**: Add User Story 2 (T020-T060) → Test independently →
   Deploy/Demo\
   _Users can now get AI insights on their specs_
4. **Schema Release**: Add User Story 3 (T061-T084) → Test independently →
   Deploy/Demo\
   _Users can now see entity relationship diagrams_
5. **Polish Release**: Add Phase 6 (T085-T096) → Final validation → Production
   release

### Parallel Team Strategy

With multiple developers (after Foundational phase complete):

1. **Team completes Setup + Foundational together** (T001-T012)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (T013-T019) - 7 tasks
   - Developer B: User Story 2 (T020-T060) - 41 tasks (largest story)
   - Developer C: User Story 3 (T061-T084) - 24 tasks
3. Stories complete and integrate independently
4. Team reconvenes for Polish phase (T085-T096)

**Recommended**: Start with MVP (US1 only), then add US2, then US3 sequentially
for single developer workflow.

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story (US1, US2, US3) for
  traceability
- Each user story should be independently completable and testable
- Total: 96 tasks across 6 phases
  - Setup: 6 tasks
  - Foundational: 6 tasks
  - US1 (P1): 7 tasks - MVP
  - US2 (P2): 41 tasks - Largest (AI integration)
  - US3 (P3): 24 tasks
  - Polish: 12 tasks
- US2 is the largest story due to dual provider support (OpenAI + Ollama) and
  multiple analysis types
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests planned for post-implementation per quickstart.md testing strategy

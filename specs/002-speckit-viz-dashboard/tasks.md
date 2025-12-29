---
description: Task list for Speckit Visualization Dashboard implementation
---

# Tasks: Speckit Documentation Visualization Dashboard

**Input**: Design documents from `/specs/001-speckit-viz-dashboard/`\
**Prerequisites**: plan.md (required), spec.md (required), research.md,
data-model.md, contracts/

**Tests**: Tests are NOT required for MVP. Focus on implementing user stories
independently.

**Organization**: Tasks are grouped by user story (P1 first, then P2, then P3)
to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5,
  US6)
- Include exact file paths in descriptions

## Path Conventions

Electron desktop application with separated main/renderer processes:

- **Main process (Node.js)**: `electron/` - File system, database, IPC
- **Renderer process (React)**: `src/` - UI components and views
- **Tests**: `tests/` - Unit, integration, component, E2E tests
- **Root**: `package.json`, configs

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize npm project with `npm init -y` and configure package.json
      with dependencies
- [x] T002 [P] Install Electron dependencies: `electron@^28.0.0`,
      `electron-builder@^24.9.0`
- [x] T003 [P] Install React dependencies: `react@^18.2.0`, `react-dom@^18.2.0`,
      `react-router-dom@^6.20.0`
- [x] T004 [P] Install TypeScript and types: `typescript@^5.3.0`,
      `@types/react`, `@types/react-dom`, `@types/node`
- [x] T005 [P] Install TailwindCSS 4 and PostCSS: `tailwindcss@^4.0.0`,
      `autoprefixer@^10.4.0`
- [x] T006 [P] Install HeroUI component library: `@heroui/react@latest`,
      `framer-motion@^10.0.0`
- [x] T007 [P] Install Vite build tools: `vite@^5.0.0`,
      `@vitejs/plugin-react@^4.0.0`
- [x] T008 [P] Install testing framework: `vitest@^1.0.0`,
      `@testing-library/react@^14.0.0`, `@playwright/test@^1.40.0`
- [x] T009 Create TypeScript config in `tsconfig.json` with strict mode enabled
- [x] T010 Create Vite config in `vite.config.ts` for Electron renderer process
- [x] T011 Create TailwindCSS config in `tailwind.config.js` with HeroUI theme
- [x] T012 Create electron-builder config in `electron-builder.yml` for
      packaging
- [x] T013 Create project directory structure: `electron/`, `src/`, `tests/`
- [x] T014 [P] Create ESLint config in `.eslintrc.js` with TypeScript rules
- [x] T015 [P] Create Prettier config in `.prettierrc` for code formatting
- [x] T016 Configure npm scripts in package.json: `dev`, `build`, `package`,
      `test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can
be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T017 Install SQLite dependency: `better-sqlite3@^9.2.0`,
      `@types/better-sqlite3@^7.6.0`
- [x] T018 Install file watching dependency: `chokidar@^3.5.0`
- [x] T019 Install markdown parsing dependencies: `remark@^15.0.0`,
      `remark-parse@^11.0.0`, `remark-gfm@^4.0.0`, `unified@^11.0.0`
- [x] T020 Create database schema SQL in `electron/utils/db-schema.sql` with 8
      tables (projects, features, tasks, entities, requirements, plans,
      research_decisions, indexes)
- [x] T021 Create Database service in `electron/services/database.ts` with
      SQLite initialization, CRUD operations, and WAL mode
- [x] T022 Create TypeScript types in `src/types/index.ts` for all entities
      (Project, Feature, Task, Entity, Requirement, Plan, Research Decision)
- [x] T023 Create IPC types in `src/types/ipc.ts` for all request/response
      interfaces from contracts/ipc-api.md
- [x] T024 Create Electron main process entry point in `electron/main.ts` with
      window creation and IPC setup
- [x] T025 Create Electron preload script in `electron/preload.ts` with secure
      context bridge for IPC
- [x] T026 Create React entry point in `src/main.tsx` with root rendering and
      strict mode
- [x] T027 Create React App component in `src/App.tsx` with React Router setup
- [x] T028 Create base styles in `src/index.css` with TailwindCSS imports and
      custom utilities
- [x] T029 Create HeroUI provider wrapper in `src/components/Providers.tsx` with
      theme configuration
- [x] T030 [P] Create ProjectContext in `src/contexts/ProjectContext.tsx` for
      active project state management
- [x] T031 [P] Create ThemeContext in `src/contexts/ThemeContext.tsx` for
      light/dark mode toggle

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 1 - Project Path Configuration (Priority: P1) 🎯 MVP

**Goal**: Enable users to configure and validate Spec-kit project paths

**Independent Test**: Launch app, configure valid/invalid paths, verify
validation and persistence

### Implementation for User Story 1

- [x] T032 [P] [US1] Create project validation utility in
      `electron/utils/project-validator.ts` with `.specify/` and `specs/` checks
- [x] T033 [P] [US1] Create IPC handler for `project:configure` in
      `electron/services/ipc-handlers.ts` with path validation
- [x] T034 [P] [US1] Create IPC handler for `project:list` in
      `electron/services/ipc-handlers.ts` to query projects table
- [x] T035 [P] [US1] Create IPC handler for `project:select` in
      `electron/services/ipc-handlers.ts` to switch active project
- [x] T036 [P] [US1] Create IPC handler for `project:remove` in
      `electron/services/ipc-handlers.ts` to delete project
- [x] T037 [US1] Create IPC service wrapper in `src/services/ipc.ts` with
      type-safe project methods
- [x] T038 [US1] Create ProjectConfigModal component in
      `src/components/ProjectConfigModal.tsx` using HeroUI Modal with form
      validation
- [x] T039 [US1] Create ProjectDropdown component in
      `src/components/ProjectDropdown.tsx` using HeroUI Dropdown to switch
      projects
- [x] T040 [US1] Add project configuration logic to App.tsx to show modal on
      first launch
- [x] T041 [US1] Implement localStorage persistence for last active project in
      ProjectContext
- [x] T042 [US1] Add error handling and user feedback for invalid paths in
      ProjectConfigModal

**Checkpoint**: User Story 1 complete - users can configure and switch between
projects

---

## Phase 4: User Story 2 - Stats Overview Dashboard (Priority: P1) 🎯 MVP

**Goal**: Display project health metrics with completion percentages and visual
charts

**Independent Test**: Load project, verify stats show feature counts, task
completion, and trend charts

### Implementation for User Story 2

- [x] T043 [P] [US2] Install charting library: `recharts@^2.10.0`
- [x] T044 [P] [US2] Create IPC handler for `stats:overview` in
      `electron/services/ipc-handlers.ts` with aggregation queries
- [x] T045 [US2] Create stats service wrapper in `src/services/ipc.ts` with
      type-safe stats methods
- [x] T046 [US2] Create StatsOverview view component in
      `src/views/StatsOverview/index.tsx` as main dashboard landing page
- [x] T047 [P] [US2] Create FeatureStatusChart component in
      `src/views/StatsOverview/FeatureStatusChart.tsx` using Recharts PieChart
- [x] T048 [P] [US2] Create TaskProgressChart component in
      `src/views/StatsOverview/TaskProgressChart.tsx` using Recharts BarChart
- [x] T049 [P] [US2] Create ProjectHealthCard component in
      `src/views/StatsOverview/ProjectHealthCard.tsx` with summary metrics
- [x] T050 [US2] Add stats overview route to App.tsx with `/` path
- [x] T051 [US2] Implement data fetching in StatsOverview using useEffect and
      IPC calls
- [x] T052 [US2] Add loading states and error handling to StatsOverview
- [x] T053 [US2] Style charts with TailwindCSS and HeroUI theme colors

**Checkpoint**: User Story 2 complete - dashboard displays project health
metrics

---

## Phase 5: User Story 3 - Feature List with Kanban Drill-Down (Priority: P1) 🎯 MVP

**Goal**: Show feature list with click-through to Kanban board for task
management

**Independent Test**: View feature list, click feature, verify Kanban board
shows tasks in correct columns

### Implementation for User Story 3

- [x] T054 [P] [US3] Create IPC handler for `features:list` in
      `electron/services/ipc-handlers.ts` with filtering support
- [x] T055 [P] [US3] Create IPC handler for `tasks:list` in
      `electron/services/ipc-handlers.ts` with groupBy support
- [x] T056 [US3] Create features service wrapper in `src/services/ipc.ts` with
      type-safe feature/task methods
- [x] T057 [US3] Create FeatureList view component in
      `src/views/FeatureList/index.tsx` with virtualized list
- [x] T058 [P] [US3] Create FeatureCard component in
      `src/components/FeatureCard.tsx` using HeroUI Card with metrics display
- [x] T059 [US3] Create KanbanBoard view component in
      `src/views/KanbanBoard/index.tsx` with column layout
- [x] T060 [P] [US3] Create KanbanColumn component in
      `src/views/KanbanBoard/KanbanColumn.tsx` for status columns (Not Started,
      In Progress, Done)
- [x] T061 [P] [US3] Create TaskCard component in `src/components/TaskCard.tsx`
      using HeroUI Card with task details
- [x] T062 [P] [US3] Create PhaseHeader component in
      `src/views/KanbanBoard/PhaseHeader.tsx` with phase goal display
- [x] T063 [US3] Add feature list route to App.tsx with `/features` path
- [x] T064 [US3] Add kanban route to App.tsx with `/features/:featureId/kanban`
      path
- [x] T065 [US3] Implement feature list data fetching in FeatureList using IPC
- [x] T066 [US3] Implement click navigation from FeatureCard to KanbanBoard
      using React Router
- [x] T067 [US3] Implement task grouping by phase and status in KanbanBoard
- [x] T068 [US3] Add loading/empty states for FeatureList and KanbanBoard

**Checkpoint**: User Story 3 complete - users can browse features and view task
breakdown

---

## Phase 6: User Story 4 - Plan Visualization with Gantt Timeline (Priority: P2)

**Goal**: Visualize implementation plans as Gantt timeline with dependencies

**Independent Test**: Select feature with plan.md, verify Gantt timeline renders
with task bars and dependency arrows

### Implementation for User Story 4

- [x] T069 [P] [US4] Create plan parser in
      `electron/services/parser/plan-parser.ts` to extract phases, tasks, and
      dependencies from plan.md
- [x] T070 [P] [US4] Create IPC handler for `features:get` in
      `electron/services/ipc-handlers.ts` to return feature with plan data
- [ ] T071 [US4] Create GanttTimeline view component in
      `src/views/GanttTimeline/index.tsx` with timeline rendering
- [ ] T072 [P] [US4] Create GanttTask component in
      `src/views/GanttTimeline/GanttTask.tsx` for task bars with progress
      indicators
- [ ] T073 [P] [US4] Create DependencyArrow component in
      `src/views/GanttTimeline/DependencyArrow.tsx` for connecting dependent
      tasks
- [ ] T074 [US4] Add gantt route to App.tsx with `/features/:featureId/gantt`
      path
- [ ] T075 [US4] Implement plan data fetching in GanttTimeline using IPC
- [ ] T076 [US4] Calculate task positions and durations based on phase order
- [ ] T077 [US4] Render dependency connections using SVG overlays
- [ ] T078 [US4] Add zoom/pan functionality for large timelines
- [ ] T079 [US4] Add requirement-to-task mapping tooltips

**Checkpoint**: User Story 4 complete - plan timelines are visualized

---

## Phase 7: User Story 5 - Architecture and Flow Visualization (Priority: P2)

**Goal**: Auto-generate architecture diagrams from data-model.md

**Independent Test**: Select feature with data-model.md, verify entity diagrams
render with correct relationships

### Implementation for User Story 5

- [ ] T080 [P] [US5] Install diagram libraries: `reactflow@^11.10.0`,
      `dagre@^0.8.5`, `@types/dagre`
- [x] T081 [P] [US5] Create data-model parser in
      `electron/services/parser/data-model-parser.ts` to extract entities and
      relationships from markdown
- [x] T082 [P] [US5] Create IPC handler for `entities:list` in
      `electron/services/ipc-handlers.ts` to query entities table
- [ ] T083 [US5] Create entity service wrapper in `src/services/ipc.ts` with
      type-safe entity methods
- [ ] T084 [US5] Create ArchitectureView view component in
      `src/views/ArchitectureView/index.tsx` with ReactFlow canvas
- [ ] T085 [P] [US5] Create EntityNode component in
      `src/views/ArchitectureView/EntityNode.tsx` as custom ReactFlow node with
      attributes display
- [ ] T086 [P] [US5] Create RelationshipEdge component in
      `src/views/ArchitectureView/RelationshipEdge.tsx` as custom ReactFlow edge
      with type labels
- [ ] T087 [US5] Create auto-layout utility in
      `src/views/ArchitectureView/layout-utils.ts` using Dagre algorithm
- [ ] T088 [US5] Add architecture route to App.tsx with
      `/features/:featureId/architecture` path
- [ ] T089 [US5] Implement entity data fetching in ArchitectureView using IPC
- [ ] T090 [US5] Convert entities to ReactFlow nodes and edges
- [ ] T091 [US5] Apply Dagre layout algorithm to position nodes
- [ ] T092 [US5] Add interactive features: zoom, pan, node selection
- [ ] T093 [US5] Create ResearchView component in
      `src/views/ArchitectureView/ResearchView.tsx` to display research
      decisions

**Checkpoint**: User Story 5 complete - architecture diagrams auto-generate from
documentation

---

## Phase 8: User Story 6 - Real-Time File Watching (Priority: P3)

**Goal**: Automatically update dashboard when Spec-kit files change on disk

**Independent Test**: Edit spec.md externally, verify dashboard updates within 5
seconds

### Implementation for User Story 6

- [ ] T094 [US6] Create FileWatcher service in
      `electron/services/file-watcher.ts` using chokidar with debouncing (500ms)
- [x] T095 [P] [US6] Create spec parser in
      `electron/services/parser/spec-parser.ts` to extract title, status,
      requirements from spec.md
- [x] T096 [P] [US6] Create tasks parser in
      `electron/services/parser/tasks-parser.ts` to parse checkbox format and
      extract task status
- [ ] T097 [US6] Integrate FileWatcher with Database service to update on file
      changes
- [ ] T098 [US6] Create file-change event emitter in `electron/main.ts` to send
      `file-watcher:change` events to renderer
- [ ] T099 [US6] Create useFileWatch hook in `src/hooks/useFileWatch.ts` to
      listen for file change events
- [ ] T100 [US6] Integrate useFileWatch into ProjectContext to trigger
      re-queries
- [ ] T101 [US6] Start file watcher when project is selected in `project:select`
      handler
- [ ] T102 [US6] Stop file watcher when project is changed or app closes
- [ ] T103 [US6] Add debouncing to parser calls to prevent excessive re-parsing
- [ ] T104 [US6] Add visual feedback (toast notification) when files update

**Checkpoint**: User Story 6 complete - dashboard auto-updates on file changes

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T105 [P] Create Navbar component in `src/components/Navbar.tsx` with
      project dropdown and view navigation
- [x] T106 [P] Add route navigation links to Navbar for all views
- [ ] T107 [P] Create ErrorBoundary component in
      `src/components/ErrorBoundary.tsx` with fallback UI
- [x] T108 [P] Create LoadingSpinner component in
      `src/components/LoadingSpinner.tsx` using HeroUI Spinner
- [ ] T109 Implement graceful error handling for malformed markdown files
- [ ] T110 Add retry logic for database operations with exponential backoff
- [ ] T111 Optimize database queries with proper indexes (already in schema)
- [ ] T112 [P] Add keyboard shortcuts for navigation (Cmd/Ctrl+K for project
      search)
- [ ] T113 [P] Implement dark mode toggle in ThemeContext with localStorage
      persistence
- [ ] T114 Add accessibility improvements: keyboard navigation, ARIA labels
      verification
- [ ] T115 [P] Run `npm run lint` and fix all warnings
- [ ] T116 [P] Run `npm run format` with Prettier on all files
- [ ] T117 Create app icon assets in `build/icons/` for macOS/Windows/Linux
- [ ] T118 Test packaging with `npm run package:mac` and verify app launches
- [ ] T119 Run manual testing procedures from quickstart.md
- [ ] T120 Document any setup issues encountered in quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user
  stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel if staffed
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No
  dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1
  for project selection
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Depends on US1
  for project selection
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US3
  for feature selection UI pattern
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Independent of
  other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Integrates
  with existing parsers from US4/US5

### Within Each User Story

- IPC handlers before service wrappers
- Service wrappers before React components
- Base components before view components
- View components before route integration
- Data fetching after UI components exist

### Parallel Opportunities

- All Setup tasks (T002-T008) can run in parallel
- All npm package installs can run together
- Parser implementations (US6: T095, T096) can run in parallel
- Chart components (US2: T047, T048) can run in parallel
- Component development within a story can often run in parallel if marked [P]

---

## Parallel Example: User Story 2 (Stats Overview)

```bash
# Launch all chart components together:
Task T047: "Create FeatureStatusChart component"
Task T048: "Create TaskProgressChart component"
Task T049: "Create ProjectHealthCard component"

# All work on different files, no dependencies between them
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Project Configuration)
4. Complete Phase 4: User Story 2 (Stats Overview)
5. Complete Phase 5: User Story 3 (Feature List + Kanban)
6. **STOP and VALIDATE**: Test these 3 P1 stories independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Minimum viable!)
3. Add User Story 2 + 3 → Test independently → Deploy/Demo (Full MVP!)
4. Add User Story 4 (Gantt) → Test independently → Deploy/Demo
5. Add User Story 5 (Architecture) → Test independently → Deploy/Demo
6. Add User Story 6 (File Watching) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Project Config)
   - Developer B: User Story 2 (Stats)
   - Developer C: User Story 3 (Kanban)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break
  independence
- SQLite database initialization happens automatically on first launch via
  Database service
- Tests are NOT included in this task list (not requested in spec)

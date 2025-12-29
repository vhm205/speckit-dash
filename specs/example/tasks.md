# Tasks: AI-Powered Tab Grouping

**Input**: Design documents from `/specs/001-ai-tab-grouping/`\
**Prerequisites**:
[plan.md](file:///Users/moment/Projects/personal/projects/saas/stop-read/specs/001-ai-tab-grouping/plan.md),
[spec.md](file:///Users/moment/Projects/personal/projects/saas/stop-read/specs/001-ai-tab-grouping/spec.md),
[research.md](file:///Users/moment/Projects/personal/projects/saas/stop-read/specs/001-ai-tab-grouping/research.md),
[data-model.md](file:///Users/moment/Projects/personal/projects/saas/stop-read/specs/001-ai-tab-grouping/data-model.md),
[contracts/api.md](file:///Users/moment/Projects/personal/projects/saas/stop-read/specs/001-ai-tab-grouping/contracts/api.md)

**Tests**: Not explicitly requested in spec - tests are optional. Including test
tasks where critical for contract verification.

**Organization**: Tasks grouped by user story to enable independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Chrome Extension structure: `stop-read-extension/`
- Background services: `stop-read-extension/background/tab-grouping/`
- UI components: `stop-read-extension/options/components/tab-grouping/`
- Library code: `stop-read-extension/lib/`
- Tests: `stop-read-extension/tests/tab-grouping/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Add @dnd-kit/core ^6.1.0 and @dnd-kit/sortable ^8.0.0 to
      stop-read-extension/package.json dependencies
- [x] T002 Add "tabGroups" permission to stop-read-extension/package.json
      manifest.permissions array
- [x] T003 [P] Run pnpm install in stop-read-extension/ directory
- [x] T004 [P] Create directory structure:
      stop-read-extension/background/tab-grouping/{services,handlers,utils}
- [x] T005 [P] Create directory structure:
      stop-read-extension/options/components/tab-grouping/
- [x] T006 [P] Create directory structure:
      stop-read-extension/tests/tab-grouping/{services,components}

---

## Phase 2: Foundational (BLOCKING - Required for all user stories)

**Purpose**: Core types, storage, and services that all features depend on

- [x] T007 [P] Create type definitions in
      stop-read-extension/lib/types/tab-grouping.ts (TabGroupConfig,
      TabMetadata, GroupingSuggestion, GroupingCommand, error types)
- [x] T008 [P] Create storage utilities in
      stop-read-extension/lib/storage/tab-groups.ts (CRUD operations for groups,
      suggestions, preferences using @plasmohq/storage)
- [x] T009 Implement TabGroupService in
      stop-read-extension/background/tab-grouping/services/TabGroupService.ts
      (createGroup, updateGroup, deleteGroup, addTabsToGroup,
      removeTabsFromGroup, syncWithChrome)
- [x] T010 Implement Chrome API wrapper in
      stop-read-extension/background/tab-grouping/utils/chrome-api-wrapper.ts
      (wrappers for chrome.tabGroups._, chrome.tabs._ with error handling)
- [ ] T011 [P] Create unit test for TabGroupService in
      stop-read-extension/tests/tab-grouping/services/TabGroupService.test.ts
      (test all public methods, error handling)
- [x] T012 Implement TabMetadataService in
      stop-read-extension/background/tab-grouping/services/TabMetadataService.ts
      (getTabMetadata, getBulkTabMetadata, updateContentSummary, in-memory
      cache)
- [ ] T013 [P] Create unit test for TabMetadataService in
      stop-read-extension/tests/tab-grouping/services/TabMetadataService.test.ts
      (test metadata extraction, caching)

**Checkpoint**: Foundation ready - user story implementation can now begin in
parallel

---

## Phase 3: User Story 3 - Manage Tabs Interface (Priority: P1) 🎯 MVP Foundation

**Goal**: Create dedicated UI section in options page for viewing and managing
all tab groups with basic operations (view groups, view tabs, close group,
reorder groups)

## Phase 3: User Story 3 - Manage Tabs Interface (P1)

**Purpose**: Build UI for displaying, organizing, and managing tab groups

**Dependency**: Requires Phase 2 (Foundational) complete

- [x] T014 Create TabGroupList component in
      stop-read-extension/options/components/tab-grouping/TabGroupList.tsx
      (display list of groups, handle drag-drop context, empty state)
- [x] T015 Create TabGroupItem component in
      stop-read-extension/options/components/tab-grouping/TabGroupItem.tsx
      (group header with color, name edit, collapse/expand, delete button, tab
      list)
- [x] T016 Create TabCard component in
      stop-read-extension/options/components/tab-grouping/TabCard.tsx (display
      tab favicon, title, domain, close button, draggable)
- [x] T017 Implement drag-and-drop functionality with @dnd-kit/core and
      @dnd-kit/sortable (handle tab reordering within groups, moving tabs
      between groups)
- [x] T018 Create message handlers in
      stop-read-extension/background/messages/tab-grouping/ (create-group.ts,
      update-group.ts, delete-group.ts, get-all-groups.ts, move-tab.ts)
- [ ] T019 Implement Chrome event listeners in
      stop-read-extension/background/tab-grouping/handlers/ (listen for
      tabGroups.onCreated, onUpdated, onRemoved, sync with storage)
- [x] T020 Integrate TabGroupingSection into options/index.tsx (add new "Tab
      Groups" tab, connect components to message handlers, handle state
      management)
- [ ] T021 Add event listeners in options/index.tsx for group-created,
      group-updated, group-deleted events from background
- [x] T021.5 [US3] Add auto-grouping settings to options page in
      stop-read-extension/options/components/tab-grouping/ (enable/disable
      auto-trigger, configure trigger conditions: tab count threshold,
      Goal-based triggers, default is disabled)
- [ ] T022 [P] [US3] Create component test for TabGroupList in
      stop-read-extension/tests/tab-grouping/components/TabGroupList.test.tsx
      (test rendering with empty/populated groups)
- [ ] T023 [P] [US3] Create component test for TabGroupItem in
      stop-read-extension/tests/tab-grouping/components/TabGroupItem.test.tsx
      (test drag handlers, edit mode, delete confirmation)

**Checkpoint**: At this point, User Story 3 should be fully functional - users
can view groups, create basic groups, close groups, and reorder groups

---

## Phase 4: User Story 1 - Auto-Group Tabs by Goal (Priority: P1) 🎯 MVP Core

**Goal**: Enable AI-powered tab grouping where tabs are automatically organized
based on user's existing Goals

**Independent Test**: Create Goal "Learn React" → open 5 React tutorial tabs + 3
unrelated tabs → click "AI Group Tabs" in Manage Tabs → verify suggestion
appears → accept suggestion → verify React tabs grouped under "Learn React" name

### Implementation for User Story 1

- [ ] T024 [US1] Implement AIGroupingService in
      stop-read-extension/background/tab-grouping/services/AIGroupingService.ts
      (generateSuggestions, acceptSuggestion, rejectSuggestion,
      getPendingSuggestions, clearExpiredSuggestions)
- [ ] T025 [US1] Design AI prompt template in AIGroupingService for multi-tab
      classification (include Goal context, tab metadata, structured JSON
      response format)
- [ ] T026 [US1] Integrate AIGroupingService with existing LLM providers in
      stop-read-extension/lib/llm/ (reuse OpenAI/Anthropic clients)
- [ ] T027 [P] [US1] Create unit test for AIGroupingService in
      stop-read-extension/tests/tab-grouping/services/AIGroupingService.test.ts
      (mock LLM responses, test suggestion generation, accept/reject,
      expiration)
- [ ] T028 [US1] Create SuggestionCard component in
      stop-read-extension/options/components/tab-grouping/SuggestionCard.tsx
      (display suggestion with Goal name, tab count, confidence score,
      accept/reject buttons, reasoning)
- [ ] T029 [US1] Update GroupingControls component to add "AI Group Tabs" button
      that calls tab-grouping:get-suggestions message
- [ ] T030 [US1] Update TabGroupList to display pending suggestions using
      SuggestionCard before group list
- [ ] T031 [US1] Add message handlers for tab-grouping:get-suggestions and
      tab-grouping:accept-suggestion in
      stop-read-extension/background/tab-grouping/handlers/message-handlers.ts
- [ ] T032 [US1] Implement suggestion storage and retrieval (save to
      chrome.storage.local with 24h expiration)
- [ ] T033 [US1] Add automatic cleanup of expired suggestions using
      chrome.alarms API (trigger every 6 hours)

**Checkpoint**: At this point, User Story 1 should be fully functional - AI can
suggest intelligent tab groupings based on Goals

---

## Phase 5: User Story 2 - Manual Tab Group Management (Priority: P2)

**Goal**: Enable manual creation, reorganization, and management of tab groups
including drag-drop, renaming, and ungrouping

**Independent Test**: Create custom group "Weekend Reading" → drag 3 tabs into
it → rename to "Research" → drag tab between groups → ungroup a tab → verify all
operations work without AI involvement

### Implementation for User Story 2

- [ ] T034 [US2] Integrate @dnd-kit/core into TabGroupList component (add
      DndContext, handle onDragEnd for tab movements)
- [ ] T035 [US2] Make TabItem component draggable using useDraggable hook from
      @dnd-kit/core (add drag handle, dragging states)
- [ ] T036 [US2] Make TabGroupCard component a drop target using useDroppable
      hook from @dnd-kit/core (handle drop zones for tabs)
- [ ] T037 [US2] Implement tab movement logic in TabGroupList onDragEnd handler
      (send tab-grouping:move-tab message to background)
- [ ] T038 [US2] Add rename functionality to TabGroupCard (inline edit on group
      name, save via tab-grouping:update-group message)
- [ ] T039 [US2] Add ungroup button to TabItem component (send
      tab-grouping:ungroup message to background)
- [ ] T040 [US2] Implement drag-drop for group reordering in TabGroupList using
      @dnd-kit/sortable (allow dragging entire groups to reorder)
- [ ] T041 [US2] Add message handlers for tab-grouping:move-tab,
      tab-grouping:update-group, tab-grouping:ungroup in
      stop-read-extension/background/tab-grouping/handlers/message-handlers.ts
- [ ] T042 [US2] Update TabGroupService to support update operations
      (updateGroup method for rename, color change)
- [ ] T043 [P] [US2] Create integration test for drag-drop in
      stop-read-extension/tests/tab-grouping/components/TabGroupList.test.tsx
      (mock drag events, verify tab movement)

**Checkpoint**: At this point, User Stories 1, 2, and 3 should all work
independently - full manual and AI-powered tab management

---

## Phase 6: User Story 4 - Tab Group Persistence (Priority: P3)

**Goal**: Persist tab groups across browser sessions so they're restored on
browser restart

**Independent Test**: Create 3 groups with various tabs → close Chrome
completely → reopen Chrome → verify all groups restored with correct names,
colors, and tab memberships

### Implementation for User Story 4

- [ ] T044 [US4] Implement tab restoration logic in
      stop-read-extension/background/tab-grouping/index.ts (listen to
      chrome.runtime.onStartup, load saved groups from storage)
- [ ] T045 [US4] Restore tab groups on browser startup (query existing tabs,
      match to saved groups, re-apply grouping via Chrome API)
- [ ] T046 [US4] Add synchronization logic to keep storage in sync with actual
      Chrome tab groups (listen to chrome.tabGroups.onUpdated,
      chrome.tabGroups.onRemoved events)
- [ ] T047 [US4] Handle edge cases: tabs closed before restoration, tabs moved
      to different windows, groups manually deleted in browser
- [ ] T048 [US4] Add setting to control auto-restoration in
      stop-read-extension/options/components/tab-grouping/ settings section
- [ ] T049 [P] [US4] Create integration test for persistence in
      stop-read-extension/tests/tab-grouping/services/TabGroupService.test.ts
      (create groups, save to storage, verify retrieval)

**Checkpoint**: All user stories should now be independently functional with
full persistence

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and undo/redo
functionality

- [ ] T050 Implement GroupingCommandService in
      stop-read-extension/background/tab-grouping/services/GroupingCommandService.ts
      (execute, undo, redo, canUndo, canRedo, clearHistory with max 20 command
      stack)
- [ ] T051 Create command classes in GroupingCommandService for each operation
      type (GroupCommand, UngroupCommand, RenameCommand, MoveTabCommand with
      data and inverseData)
- [ ] T052 Integrate GroupingCommandService with TabGroupService operations
      (wrap all user actions in commands, push to undo stack)
- [ ] T053 Create UndoRedoControls component in
      stop-read-extension/options/components/tab-grouping/UndoRedoControls.tsx
      (undo button, redo button, disabled states, stack size display)
- [ ] T054 Add UndoRedoControls to stop-read-extension/options/index.tsx in
      Manage Tabs section header
- [ ] T055 Add message handlers for tab-grouping:undo and tab-grouping:redo in
      stop-read-extension/background/tab-grouping/handlers/message-handlers.ts
- [ ] T056 [P] Create unit test for GroupingCommandService in
      stop-read-extension/tests/tab-grouping/services/GroupingCommandService.test.ts
      (test each command type, undo/redo sequences, stack limits)
- [ ] T057 [P] Add performance optimization for large tab counts (implement lazy
      loading, debounce storage writes, batch Chrome API calls)
- [ ] T058 [P] Add error handling and user feedback (toast notifications for
      errors, loading spinners, retry logic)
- [ ] T058.1 [P] Handle Goal deletion edge case (remove Goal association from
      groups or prompt user to delete/keep groups)
- [ ] T058.2 [P] Handle duplicate URLs edge case (allow same URL in multiple
      groups with visual indicator/warning)
- [ ] T058.3 [P] Handle incognito tabs edge case (exclude from AI grouping or
      show appropriate error message)
- [ ] T059 [P] Update stop-read-extension/README.md with tab grouping feature
      documentation
- [ ] T060 Run manual testing workflow from
      stop-read-extension/specs/001-ai-tab-grouping/quickstart.md (all 6 test
      scenarios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T006) - BLOCKS
  all user stories
- **User Story 3 (Phase 3)**: Depends on Foundational completion (T007-T013)
- **User Story 1 (Phase 4)**: Depends on US3 completion (T014-T023) for UI
  infrastructure - needs Manage Tabs interface to display suggestions
- **User Story 2 (Phase 5)**: Depends on US3 completion (T014-T023) for UI
  infrastructure - can run in parallel with US1
- **User Story 4 (Phase 6)**: Depends on US3 completion - can run in parallel
  with US1 and US2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No
  dependencies on other stories - PROVIDES UI infrastructure for other stories
- **User Story 1 (P1)**: Depends on User Story 3 for Manage Tabs UI - Can run in
  parallel with US2 and US4 after US3
- **User Story 2 (P2)**: Depends on User Story 3 for UI components - Can run in
  parallel with US1 and US4 after US3
- **User Story 4 (P3)**: Depends on User Story 3 for basic grouping
  functionality - Can run in parallel with US1 and US2 after US3

### Within Each User Story

- Models/types before services
- Services before message handlers
- Message handlers before UI components
- Core implementation before integration
- Tests can run in parallel with implementation (marked [P])

### Parallel Opportunities

- **Setup Phase**: T001-T006 all marked [P] can run in parallel
- **Foundational Phase**: T007-T008, T011, T013 marked [P] can run in parallel
  (after their dependencies complete)
- **User Story 3**: T014-T015, T022-T023 marked [P] can run in parallel
- **User Story 1**: T027 marked [P] can run in parallel with T028-T030
- **User Story 2**: T043 marked [P] can run in parallel with implementation
- **User Story 4**: T049 marked [P] can run in parallel with implementation
- **Polish Phase**: T056-T059 marked [P] can run in parallel
- **After US3 completes**: US1, US2, and US4 can ALL run in parallel (different
  features, independent testing)

---

## Parallel Example: After Foundational Phase

```bash
# After T007-T013 complete, these user stories can proceed in parallel:

Developer A - User Story 3:
Task: "Create TabItem component in stop-read-extension/options/components/tab-grouping/TabItem.tsx"
Task: "Create TabGroupCard component in stop-read-extension/options/components/tab-grouping/TabGroupCard.tsx"
# Continue with US3 tasks...

# After US3 completes, these can run in parallel:

Developer B - User Story 1:
Task: "Implement AIGroupingService in stop-read-extension/background/tab-grouping/services/AIGroupingService.ts"

Developer C - User Story 2:
Task: "Integrate @dnd-kit/core into TabGroupList component"

Developer D - User Story 4:
Task: "Implement tab restoration logic in stop-read-extension/background/tab-grouping/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 3 + User Story 1)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013) - CRITICAL
3. Complete Phase 3: User Story 3 (T014-T023) - Basic Manage Tabs UI
4. **STOP and VALIDATE**: Can view groups, create basic groups, close groups
5. Complete Phase 4: User Story 1 (T024-T033) - AI-powered grouping
6. **STOP and VALIDATE**: AI grouping works end-to-end with suggestions
7. Deploy/demo MVP: Users can AI-group tabs and view them in Manage Tabs

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → T001-T013 complete → Infrastructure
   ready
2. **MVP v1** (+ User Story 3) → T014-T023 complete → Can view and manage groups
   manually
3. **MVP v2** (+ User Story 1) → T024-T033 complete → AI-powered grouping works
   ⭐
4. **Full Features** (+ User Story 2) → T034-T043 complete → Drag-drop and
   advanced management
5. **Production Ready** (+ User Story 4 + Polish) → T044-T060 complete →
   Persistence and undo/redo

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (T001-T013)
2. **Once Foundational done**:
   - Developer A: User Story 3 (T014-T023) - BLOCKS other stories
3. **Once US3 done** (in parallel):
   - Developer A: User Story 1 (T024-T033)
   - Developer B: User Story 2 (T034-T043)
   - Developer C: User Story 4 (T044-T049)
4. **Final**: Polish together (T050-T060)

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Critical Path**: Setup → Foundational → US3 → (US1 || US2 || US4) → Polish
- **MVP Recommendation**: Deliver through US1 (Auto-Group Tabs) for maximum
  value
- Run pnpm test after each service implementation to verify unit tests pass
- Use quickstart.md manual test procedures for end-to-end validation

---

## Task Summary

**Total Tasks**: 64

- Setup Phase: 6 tasks
- Foundational Phase: 7 tasks (BLOCKS all user stories)
- User Story 3 (P1 - Manage Tabs UI): 11 tasks (added T021.5)
- User Story 1 (P1 - AI Grouping): 10 tasks
- User Story 2 (P2 - Manual Management): 10 tasks
- User Story 4 (P3 - Persistence): 6 tasks
- Polish Phase: 14 tasks (added T058.1-T058.3)

**Parallel Opportunities**: 21 tasks marked [P] (added 3 new parallelizable edge
case tasks)

**Independent Test Criteria**:

- US3: View/create groups UI works
- US1: AI suggestions appear and create correct groups
- US2: Drag-drop and manual operations work
- US4: Groups persist across browser restarts

**Suggested MVP Scope**: Setup + Foundational + US3 + US1 (34 tasks) - Delivers
core value of AI-powered tab grouping

**Format Validation**: ✅ All tasks follow
`- [ ] [ID] [P?] [Story?] Description with file path` format

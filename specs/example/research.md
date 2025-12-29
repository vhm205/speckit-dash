# Research: AI-Powered Tab Grouping

**Feature**: 001-ai-tab-grouping\
**Date**: 2025-12-23\
**Purpose**: Technical research and decision rationale for implementing
AI-powered tab grouping in a Chrome extension

## Technical Stack Research

### Decision: Use Existing Plasmo Framework + Chrome Extension APIs

**Rationale**:

- Project already uses Plasmo 0.90.5 framework for Chrome extension development
- Plasmo provides excellent TypeScript support and React integration
- Chrome Extension API `chrome.tabGroups` provides native tab grouping
  capabilities (Chrome 88+)
- Consistent with existing codebase patterns and developer familiarity

**Alternatives considered**:

- Custom extension build system: Rejected due to unnecessary complexity and loss
  of Plasmo's developer experience features
- Browser-agnostic extension framework (WebExtension Polyfill): Rejected as
  project is Chrome-exclusive and native Chrome APIs provide better performance

## Tab Grouping Implementation Approach

### Decision: Use Chrome Native Tab Groups API

**Rationale**:

- Chrome's native `chrome.tabGroups` API provides built-in tab grouping with
  visual indicators
- Better performance than custom UI implementation
- Native browser experience with colors, collapse/expand, and drag-drop
- Users already familiar with Chrome's tab group UX

**Key APIs**:

- `chrome.tabGroups.query()` - Query existing groups
- `chrome.tabGroups.update()` - Update group properties (title, color)
- `chrome.tabGroups.move()` - Reorder groups
- `chrome.tabs.group()` - Add tabs to groups
- `chrome.tabs.ungroup()` - Remove tabs from groups

**Alternatives considered**:

- Custom visual grouping in extension UI: Rejected due to poor UX compared to
  native browser grouping
- Tab organization via separate window management: Rejected as it doesn't
  provide visual grouping within a single window

## AI Integration for Smart Grouping

### Decision: Use Existing AI Provider System with Context-Based Analysis

**Rationale**:

- Extension already has AI provider configuration (OpenAI, Anthropic support in
  `lib/llm/`)
- Can leverage existing Goal analysis patterns from content relevance feature
- AI can analyze tab URLs, titles, and cached content to suggest intelligent
  groupings
- Reuse existing `storage.ts` patterns for persisting group configurations

**Analysis Approach**:

1. Collect tab metadata (URL, title, domain, last accessed)
2. Retrieve user's Goals from storage
3. Send to LLM with prompt: "Which of these tabs relate to Goal X?"
4. Parse LLM response to create grouping suggestions
5. Apply groupings via Chrome API

**Alternatives considered**:

- Local ML model (e.g., TensorFlow.js): Rejected due to payload size concerns
  and lower accuracy vs LLMs
- Rule-based grouping (domain matching only): Rejected as it doesn't leverage
  semantic understanding of user Goals
- Chrome's built-in tab organization AI: Not available yet in stable APIs

## Storage Strategy

### Decision: Extend Existing @plasmohq/storage System

**Rationale**:

- Project already uses `@plasmohq/storage` for Goals, settings, and analysis
  data
- Provides Chrome storage abstraction with TypeScript support
- Can store tab group configurations keyed by group ID
- Automatic sync across browser sessions via chrome.storage.sync

**Data Model**:

```typescript
interface TabGroupConfig {
  id: string; // Chrome tab group ID
  name: string; // User-defined group name
  goalId?: string; // Optional associated Goal ID
  color: string; // Chrome group color
  tabIds: number[]; // Array of tab IDs
  createdAt: number;
  updatedAt: number;
  isAIGenerated: boolean;
}
```

**Alternatives considered**:

- IndexedDB: Rejected as unnecessary complexity for relatively small dataset
- External database: Rejected as extension is offline-first
- Chrome bookmarks API: Rejected as it's for URLs, not live tab management

## UI Integration in Options Page

### Decision: Add "Manage Tabs" Section to Existing Options Page

**Rationale**:

- Extension already has options page at `options/index.tsx`
- Can follow existing UI patterns (React components, state management)
- Centralized location for all extension settings and management
- Spec explicitly requires options page integration

**Components to Create**:

1. `TabGroupList` - Display all groups
2. `TabGroupCard` - Individual group with tabs
3. `TabItem` - Draggable tab item with favicon, title
4. `GroupingControls` - AI grouping trigger, manual group creation

**Drag-and-Drop Library**:

- Use `@dnd-kit/core` - Modern React drag-and-drop library
- Type-safe, accessible, and performant
- Better than HTML5 drag-drop API for complex interactions

**Alternatives considered**:

- Separate management page: Rejected as options page is already the central hub
- Popup-based management: Rejected due to limited space for complex tab
  organization
- Background-only with no UI: Rejected as spec requires visual management
  interface

## Performance Considerations

### Decision: Lazy Load Tab Group Data

**Rationale**:

- Users may have 100+ tabs, causing potential performance issues
- Load group configurations on-demand when options page opens
- Cache in-memory during active session
- Debounce group updates to avoid excessive storage writes

**Optimization Strategies**:

1. Virtualized list for large tab counts (react-window if needed)
2. Batch tab operations (group multiple tabs in single API call)
3. Throttle AI analysis to avoid rate limiting
4. Use Chrome alarms API for periodic cleanup of stale group data

**Alternatives considered**:

- Load all tab data upfront: Rejected due to potential performance degradation
- Real-time sync without debouncing: Rejected due to excessive storage writes
- Eager AI analysis on every tab open: Rejected due to API costs and latency

## Testing Strategy

### Decision: Unit + Integration Tests with Vitest, Manual Browser Testing

**Rationale**:

- Project already uses Vitest for testing (`vitest.config.ts` exists)
- Can mock Chrome APIs using `@types/chrome`
- Integration tests for storage operations
- Manual testing required for drag-drop and native Chrome tab group interactions

**Test Coverage**:

1. **Unit Tests**: Tab grouping logic, data transformations, AI response parsing
2. **Integration Tests**: Storage operations, Chrome API interactions (mocked)
3. **Manual Tests**: Full workflow in loaded extension, drag-drop UX, goal-based
   grouping

**Alternatives considered**:

- E2E tests with Puppeteer: Rejected as Chrome extension automation is complex
  and brittle
- Jest instead of Vitest: Rejected as project already standardized on Vitest
- No testing: Rejected per constitution's Test-First discipline

## Chrome Extension Permissions

### Decision: Add tabGroups and activeTab Permissions

**Current Permissions** (from package.json manifest):

- `tabs`, `storage`, `idle`, `alarms`, `contextMenus`

**Required Additions**:

- `tabGroups` - For tab group management APIs

**Rationale**:

- `tabGroups` permission required for chrome.tabGroups API
- Minimal additional permissions needed
- `tabs` permission already granted for tab metadata access

**Alternatives considered**:

- Request all_urls for content access: Rejected as not needed for basic grouping
- Use declarativeContent for tab filtering: Rejected as it's for content
  scripts, not tab management

## AI Analysis Optimization

### Decision: Batch Analysis with Summarization

**Rationale**:

- Analyzing each tab individually is expensive (API calls, latency)
- Batch 10-20 tabs per AI request with concise metadata
- Use system prompt to optimize for multi-tab classification
- Cache analysis results for 24 hours to avoid redundant calls

**Prompt Strategy**:

```
Given these user Goals: [Goal 1, Goal 2, ...]
And these tabs: [Tab 1: title, URL], [Tab 2: title, URL], ...
Group related tabs by Goal. Return JSON: { goalId: [tabIds] }
```

**Alternatives considered**:

- Individual tab analysis: Rejected due to high cost and latency
- Client-side embedding models: Rejected due to limited accuracy vs LLMs
- No caching: Rejected due to redundant API calls

## Undo/Redo System

### Decision: Command Pattern with Stack-Based History

**Rationale**:

- Required by FR-015 (undo/redo functionality)
- Command pattern encapsulates grouping operations as reversible actions
- Maintain undo stack (max 20 operations) in memory
- Clear stack on options page close

**Commands to Support**:

1. GroupTabsCommand - Group tabs (undo: ungroup)
2. UngroupTabsCommand - Ungroup tabs (undo: re-group)
3. RenameGroupCommand - Rename group (undo: restore old name)
4. MoveTabCommand - Move tab between groups (undo: move back)

**Alternatives considered**:

- Event sourcing: Rejected as overkill for local-only extension
- No undo: Rejected as spec requires it (FR-015)
- Chrome history API: Rejected as it's for browsing history, not extension state

## Summary of Key Decisions

| Aspect         | Decision               | Primary Rationale                            |
| -------------- | ---------------------- | -------------------------------------------- |
| Tab Grouping   | Chrome Native API      | Best UX, native browser integration          |
| AI Integration | Existing LLM providers | Reuse infrastructure, semantic understanding |
| Storage        | @plasmohq/storage      | Consistency with existing patterns           |
| UI Location    | Options page section   | Centralized management, follows spec         |
| Drag-Drop      | @dnd-kit/core          | Modern, accessible, type-safe                |
| Testing        | Vitest + Manual        | Leverage existing setup, cover UX flows      |
| Permissions    | Add tabGroups          | Minimal addition to existing grants          |
| Performance    | Lazy loading + caching | Handle 100+ tabs efficiently                 |
| Undo/Redo      | Command pattern        | Clean, maintainable, supports FR-015         |

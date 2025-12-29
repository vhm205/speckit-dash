# Data Model: AI-Powered Tab Grouping

**Feature**: 001-ai-tab-grouping\
**Date**: 2025-12-23

## Core Entities

### TabGroupConfig

Represents a tab group configuration persisted in storage.

**Fields**:

- `id: string` - Unique identifier (Chrome tab group ID)
- `name: string` - User-defined group name
- `goalId: string | null` - Optional associated Goal ID (null for manual groups)
- `color: ChromeTabGroupColor` - Group color (blue, red, yellow, green, cyan,
  pink, purple, grey)
- `collapsed: boolean` - Whether group is collapsed
- `tabIds: number[]` - Array of Chrome tab IDs in this group
- `createdAt: number` - Unix timestamp of creation
- `updatedAt: number` - Unix timestamp of last modification
- `isAIGenerated: boolean` - Whether group was created by AI or manually

**Validation Rules**:

- `name` must be non-empty and max 100 characters
- `tabIds` must contain unique tab IDs
- `createdAt <= updatedAt`

**Relationships**:

- One-to-many with tabs (one group contains multiple tabs)
- Optional many-to-one with Goal (multiple groups can share same Goal)

### TabMetadata

Cached metadata about a tab for AI analysis.

**Fields**:

- `id: number` - Chrome tab ID
- `url: string` - Tab URL
- `title: string` - Tab title
- `faviconUrl: string | null` - Favicon URL
- `domain: string` - Extracted domain (e.g., "github.com")
- `lastAccessed: number` - Unix timestamp of last access
- `groupId: string | null` - Current group ID (null if ungrouped)
- `contentSummary: string | null` - Cached AI-generated summary (optional)

**Validation Rules**:

- `url` must be valid HTTP/HTTPS URL
- `domain` extracted using URL parser
- `lastAccessed` updated on tab activation

**Relationships**:

- One-to-one with browser tab (ephemeral, recreated on browser restart)
- Optional many-to-one with TabGroupConfig

### GroupingSuggestion

AI-generated suggestion for grouping tabs.

**Fields**:

- `id: string` - Unique suggestion ID (UUID)
- `goalId: string | null` - Related Goal ID
- `suggestedName: string` - AI-suggested group name
- `tabIds: number[]` - Tabs to group together
- `confidence: number` - AI confidence score (0-1)
- `reasoning: string` - Brief explanation of grouping rationale
- `createdAt: number` - When suggestion was generated
- `status: SuggestionStatus` - "pending" | "accepted" | "rejected" | "expired"

**Validation Rules**:

- `confidence` must be between 0 and 1
- `tabIds` must have at least 2 tabs
- Suggestions expire after 24 hours

**State Transitions**:

```
pending → accepted (user accepts suggestion)
pending → rejected (user dismisses suggestion)
pending → expired (24 hours pass)
```

### GroupingCommand

Command pattern for undo/redo operations.

**Fields**:

- `id: string` - Command ID (UUID)
- `type: CommandType` - "group" | "ungroup" | "rename" | "move" | "reorder"
- `timestamp: number` - When command was executed
- `data: CommandData` - Command-specific data
- `inverseData: CommandData` - Data needed to undo

**Command Types**:

#### GroupCommand

```typescript
data: {
  tabIds: number[];
  groupName: string;
  color: ChromeTabGroupColor;
}
inverseData: {
  originalGroupIds: (string | null)[]; // restore original groups
}
```

#### UngroupCommand

```typescript
data: {
  groupId: string;
}
inverseData: {
  groupConfig: TabGroupConfig; // restore group
}
```

#### RenameCommand

```typescript
data: {
  groupId: string;
  newName: string;
}
inverseData: {
  oldName: string;
}
```

#### MoveTabCommand

```typescript
data: {
  tabId: number;
  fromGroupId: string | null;
  toGroupId: string | null;
}
inverseData: {
  // same structure (swap from/to)
}
```

## Storage Structure

### Chrome Storage Keys

```typescript
// Storage schema
{
  // Tab groups (keyed by group ID)
  "tabGroups": {
    [groupId: string]: TabGroupConfig
  },
  
  // Active grouping suggestions
  "groupingSuggestions": GroupingSuggestion[],
  
  // Undo/Redo stacks (session only, not persisted)
  "undoStack": GroupingCommand[], // max 20
  "redoStack": GroupingCommand[], // max 20
  
  // User preferences
  "tabGroupingPreferences": {
    autoGroupEnabled: boolean;
    suggestionsEnabled: boolean;
    defaultGroupColor: ChromeTabGroupColor;
  }
}
```

### Chrome Sync vs Local Storage

- `tabGroups`: **Sync storage** (persists across devices)
- `groupingSuggestions`: **Local storage** (device-specific)
- `undoStack/redoStack`: **Memory only** (session-specific)
- `tabGroupingPreferences`: **Sync storage** (user preferences)

## Entity Relationships Diagram

```
┌─────────────────┐
│      Goal       │
│  (existing)     │
└────────┬────────┘
         │
         │ 0..*     ┌──────────────────┐
         └──────────│ TabGroupConfig   │
                    │                  │
                    │ - id             │
                    │ - name           │
                    │ - goalId?        │
                    │ - tabIds[]       │
                    └────────┬─────────┘
                             │
                             │ 1..*
                             │
                    ┌────────▼─────────┐
                    │  TabMetadata     │
                    │                  │
                    │ - id             │
                    │ - url            │
                    │ - title          │
                    │ - groupId?       │
                    └──────────────────┘

┌────────────────────┐
│ GroupingSuggestion │
│                    │
│ - tabIds[]         │
│ - goalId?          │
│ - status           │
└────────────────────┘

┌────────────────────┐
│ GroupingCommand    │
│ (undo/redo stack)  │
│                    │
│ - type             │
│ - data             │
│ - inverseData      │
└────────────────────┘
```

## API Data Flows

### Creating AI-Generated Group

1. User triggers AI grouping
2. Fetch all open tabs → `TabMetadata[]`
3. Fetch user Goals → `Goal[]`
4. Send to AI API → `GroupingSuggestion[]`
5. Display suggestions to user
6. User accepts → Create `TabGroupConfig`
7. Call `chrome.tabs.group(tabIds)` → Get Chrome group ID
8. Call `chrome.tabGroups.update(groupId, {title, color})`
9. Save `TabGroupConfig` to storage
10. Push `GroupCommand` to undo stack

### Manual Group Creation

1. User selects tabs in UI
2. User provides group name
3. Create `TabGroupConfig` with `isAIGenerated: false`
4. Call `chrome.tabs.group(tabIds)`
5. Call `chrome.tabGroups.update(groupId, {title, color})`
6. Save to storage
7. Push `GroupCommand` to undo stack

### Drag-Drop Tab Between Groups

1. User drags tab from Group A to Group B
2. Create `MoveTabCommand` with inverse data
3. Call `chrome.tabs.ungroup(tabId)`
4. Call `chrome.tabs.group({tabIds: [tabId], groupId: groupB.id})`
5. Update `TabGroupConfig` for both groups
6. Save to storage
7. Push command to undo stack

### Undo Operation

1. Pop command from undo stack
2. Execute inverse operation using `inverseData`
3. Push original command to redo stack
4. Update Chrome tab groups
5. Update storage

## Type Definitions

```typescript
type ChromeTabGroupColor =
  | "blue"
  | "red"
  | "yellow"
  | "green"
  | "cyan"
  | "pink"
  | "purple"
  | "grey";

type SuggestionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired";

type CommandType =
  | "group"
  | "ungroup"
  | "rename"
  | "move"
  | "reorder";
```

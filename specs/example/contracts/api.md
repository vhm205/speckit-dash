# API Contracts: Tab Grouping Service

**Feature**: 001-ai-tab-grouping\
**Date**: 2025-12-23

## Internal Extension APIs

These are TypeScript interfaces defining the internal service contracts for tab
grouping functionality.

### TabGroupService

Main service for managing tab groups.

```typescript
interface TabGroupService {
  /**
   * Create a new tab group
   * @throws Error if tab IDs are invalid or already grouped
   */
  createGroup(params: {
    name: string;
    tabIds: number[];
    color?: ChromeTabGroupColor;
    goalId?: string;
  }): Promise<TabGroupConfig>;

  /**
   * Update existing group properties
   * @throws Error if group ID not found
   */
  updateGroup(groupId: string, updates: {
    name?: string;
    color?: ChromeTabGroupColor;
    collapsed?: boolean;
  }): Promise<TabGroupConfig>;

  /**
   * Delete a group (can preserve or close tabs)
   * @throws Error if group ID not found
   */
  deleteGroup(groupId: string, closeTabs: boolean): Promise<void>;

  /**
   * Get all tab groups
   */
  getAllGroups(): Promise<TabGroupConfig[]>;

  /**
   * Get group by ID
   * @returns null if not found
   */
  getGroup(groupId: string): Promise<TabGroupConfig | null>;

  /**
   * Move tab to a different group
   * @throws Error if tab or group ID invalid
   */
  moveTabToGroup(tabId: number, toGroupId: string | null): Promise<void>;

  /**
   * Ungroup tabs (remove from group)
   */
  ungroupTabs(tabIds: number[]): Promise<void>;

  /**
   * Reorder groups
   */
  reorderGroups(groupIds: string[]): Promise<void>;
}
```

### AIGroupingService

Service for AI-powered tab grouping suggestions.

```typescript
interface AIGroupingService {
  /**
   * Generate grouping suggestions based on user Goals
   * @throws Error if AI provider not configured
   */
  generateSuggestions(params: {
    tabIds?: number[]; // if omitted, analyze all open tabs
    goalIds?: string[]; // if omitted, use all user Goals
  }): Promise<GroupingSuggestion[]>;

  /**
   * Accept a grouping suggestion (creates the group)
   */
  acceptSuggestion(suggestionId: string): Promise<TabGroupConfig>;

  /**
   * Reject a grouping suggestion
   */
  rejectSuggestion(suggestionId: string): Promise<void>;

  /**
   * Get all pending suggestions
   */
  getPendingSuggestions(): Promise<GroupingSuggestion[]>;

  /**
   * Clear expired suggestions (>24 hours old)
   */
  clearExpiredSuggestions(): Promise<void>;
}
```

### TabMetadataService

Service for managing tab metadata.

```typescript
interface TabMetadataService {
  /**
   * Get metadata for a tab
   * @returns null if tab not found
   */
  getTabMetadata(tabId: number): Promise<TabMetadata | null>;

  /**
   * Get metadata for multiple tabs
   */
  getBulkTabMetadata(tabIds: number[]): Promise<TabMetadata[]>;

  /**
   * Update tab metadata (called on tab events)
   */
  updateTabMetadata(
    tabId: number,
    updates: Partial<TabMetadata>,
  ): Promise<void>;

  /**
   * Clear metadata for closed tabs
   */
  pruneClosedTabs(): Promise<void>;

  /**
   * Generate content summary using AI (for better grouping)
   */
  generateContentSummary(tabId: number): Promise<string>;
}
```

### GroupingCommandService

Service for undo/redo functionality.

```typescript
interface GroupingCommandService {
  /**
   * Execute a grouping command
   */
  execute(command: GroupingCommand): Promise<void>;

  /**
   * Undo last command
   * @returns false if undo stack empty
   */
  undo(): Promise<boolean>;

  /**
   * Redo last undone command
   * @returns false if redo stack empty
   */
  redo(): Promise<boolean>;

  /**
   * Check if undo is available
   */
  canUndo(): boolean;

  /**
   * Check if redo is available
   */
  canRedo(): boolean;

  /**
   * Clear undo/redo history
   */
  clearHistory(): Promise<void>;

  /**
   * Get undo stack size (for UI display)
   */
  getUndoStackSize(): number;
}
```

## Chrome Extension Message API

Messages for background script communication.

### Messages Sent to Background

```typescript
// Create group
{
  type: "tab-grouping:create-group";
  payload: {
    name: string;
    tabIds: number[];
    color?: ChromeTabGroupColor;
    goalId?: string;
  };
  // Response: TabGroupConfig
}

// Get AI suggestions
{
  type: "tab-grouping:get-suggestions";
  payload: {
    tabIds?: number[];
    goalIds?: string[];
  };
  // Response: GroupingSuggestion[]
}

// Accept suggestion
{
  type: "tab-grouping:accept-suggestion";
  payload: {
    suggestionId: string;
  };
  // Response: TabGroupConfig
}

// Move tab to group
{
  type: "tab-grouping:move-tab";
  payload: {
    tabId: number;
    toGroupId: string | null;
  };
  // Response: void
}

// Undo/Redo
{
  type: "tab-grouping:undo" | "tab-grouping:redo";
  payload: {};
  // Response: boolean (success)
}

// Get all groups
{
  type: "tab-grouping:get-all-groups";
  payload: {};
  // Response: TabGroupConfig[]
}
```

### Messages Sent from Background

```typescript
// Group created event
{
  type: "tab-grouping:group-created";
  payload: {
    group: TabGroupConfig;
  }
}

// Group updated event
{
  type: "tab-grouping:group-updated";
  payload: {
    groupId: string;
    updates: Partial<TabGroupConfig>;
  }
}

// Group deleted event
{
  type: "tab-grouping:group-deleted";
  payload: {
    groupId: string;
  }
}

// New suggestion available
{
  type: "tab-grouping:suggestion-available";
  payload: {
    suggestion: GroupingSuggestion;
  }
}
```

## Storage API Contract

Data persistence using @plasmohq/storage.

```typescript
// Storage keys and types
const StorageKeys = {
  TAB_GROUPS: "tabGroups", // Record<string, TabGroupConfig>
  SUGGESTIONS: "groupingSuggestions", // GroupingSuggestion[]
  PREFERENCES: "tabGroupingPreferences", // TabGroupingPreferences
} as const;

interface TabGroupingPreferences {
  autoGroupEnabled: boolean;
  suggestionsEnabled: boolean;
  defaultGroupColor: ChromeTabGroupColor;
  showSuggestionNotifications: boolean;
}
```

## Error Handling

All services should throw typed errors:

```typescript
class TabGroupError extends Error {
  constructor(
    message: string,
    public code: TabGroupErrorCode,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TabGroupError";
  }
}

enum TabGroupErrorCode {
  GROUP_NOT_FOUND = "GROUP_NOT_FOUND",
  TAB_NOT_FOUND = "TAB_NOT_FOUND",
  INVALID_TAB_IDS = "INVALID_TAB_IDS",
  AI_PROVIDER_NOT_CONFIGURED = "AI_PROVIDER_NOT_CONFIGURED",
  AI_REQUEST_FAILED = "AI_REQUEST_FAILED",
  CHROME_API_ERROR = "CHROME_API_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
}
```

## Response Types

Standard response format for consistency:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

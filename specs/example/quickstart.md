# Quick Start: AI-Powered Tab Grouping

**Feature**: 001-ai-tab-grouping\
**Last Updated**: 2025-12-23

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm (package manager used by project)
- Chrome browser (for testing)

### Installation

```bash
cd stop-read-extension
pnpm install  # dependencies already in package.json
```

### Additional Dependencies

Add these to package.json:

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0"
  }
}
```

Run `pnpm install` after adding.

## Running the Extension

### Development Mode

```bash
cd stop-read-extension
pnpm dev
```

This starts the Plasmo dev server and creates a `build/chrome-mv3-dev`
directory.

### Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `stop-read-extension/build/chrome-mv3-dev`

### Hot Reload

Plasmo provides automatic hot reload. Changes to source files will rebuild and
refresh the extension.

## Project Structure

```
stop-read-extension/
├── background/
│   └── tab-grouping/        # NEW: Background services
│       ├── services/
│       │   ├── TabGroupService.ts
│       │   ├── AIGroupingService.ts
│       │   ├── TabMetadataService.ts
│       │   └── GroupingCommandService.ts
│       ├── handlers/        # Message handlers
│       └── index.ts         # Export services
│
├── lib/
│   ├── types/
│   │   └── tab-grouping.ts  # NEW: Type definitions
│   └── storage/
│       └── tab-groups.ts    # NEW: Storage utilities
│
├── options/
│   ├── components/
│   │   └── tab-grouping/    # NEW: UI components
│   │       ├── TabGroupList.tsx
│   │       ├── TabGroupCard.tsx
│   │       ├── TabItem.tsx
│   │       └── GroupingControls.tsx
│   └── index.tsx            # Update with new section
│
└── tests/
    └── tab-grouping/        # NEW: Tests
        ├── services/
        └── components/
```

## Testing

### Run Unit Tests

```bash
cd stop-read-extension
pnpm test
```

This runs Vitest tests for all `*.test.ts` and `*.test.tsx` files.

### Run Specific Test Suite

```bash
pnpm test tab-grouping
```

### Watch Mode

```bash
pnpm test --watch
```

## Manual Testing Workflow

### 1. Test Basic Group Creation

1. Open Chrome with loaded extension
2. Open 5-10 tabs on different topics
3. Right-click Options icon → "Open options page"
4. Navigate to "Manage Tabs" section
5. Click "Create Group" button
6. Select tabs manually, name the group
7. Verify tabs are grouped in browser with colored tab groups

### 2. Test AI Grouping

1. Create at least one Goal in extension
2. Open tabs related to that Goal (e.g., learning resources)
3. Open tabs unrelated to any Goal
4. In "Manage Tabs", click "AI Group Tabs"
5. Verify suggestions appear with confidence scores
6. Accept a suggestion
7. Verify tabs are grouped correctly with Goal name

### 3. Test Drag-and-Drop

1. With multiple groups created, drag a tab from one group to another
2. Verify tab moves visually in UI
3. Verify tab group changes in Chrome browser
4. Check storage (DevTools → Application → Storage) to verify persistence

### 4. Test Undo/Redo

1. Create a group
2. Click "Undo" button
3. Verify group is removed
4. Click "Redo" button
5. Verify group is recreated

## Chrome Extension APIs Used

### Required Permissions (already in manifest)

- `tabs` ✓ (already present)
- `storage` ✓ (already present)

### New Permission Required

Add `tabGroups` to manifest.permissions in package.json:

```json
{
  "manifest": {
    "permissions": [
      "contextMenus",
      "tabs",
      "storage",
      "idle",
      "alarms",
      "tabGroups"
    ]
  }
}
```

### Key APIs

- `chrome.tabGroups.query()` - List all tab groups
- `chrome.tabs.group()` - Create/add to groups
- `chrome.tabs.ungroup()` - Remove from groups
- `chrome.tabGroups.update()` - Update group title/color
- `chrome.storage.sync` - Persist group configurations

## Debugging

### View Background Script Logs

1. Go to `chrome://extensions/`
2. Find "Stop Read Extension"
3. Click "Inspect views: service worker"
4. Open Console tab

### View Options Page Logs

1. Open Options page
2. Right-click → Inspect
3. Console tab shows UI logs

### Check Storage

1. Open DevTools (F12)
2. Application tab → Storage
3. chrome.storage → Sync/Local
4. Look for `tabGroups`, `groupingSuggestions` keys

## Common Issues

### Issue: Tab groups not appearing in browser

**Solution**: Ensure `tabGroups` permission is added to manifest and extension
is reloaded.

### Issue: AI grouping fails

**Solution**: Check that AI provider is configured in extension settings and has
valid API key.

### Issue: Drag-drop not working

**Solution**: Ensure `@dnd-kit/core` is installed. Check browser console for
errors.

### Issue: Groups not persisting across sessions

**Solution**: Verify storage API calls are using `chrome.storage.sync` not
local/session storage.

## Next Steps

After setting up:

1. Read `research.md` for technical decisions
2. Review `data-model.md` for entity definitions
3. Check `contracts/api.md` for service interfaces
4. Start implementation with `/speckit.tasks` command

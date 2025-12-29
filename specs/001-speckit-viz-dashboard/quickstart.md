# Quickstart Guide: Speckit Visualization Dashboard

**Feature**: Speckit Documentation Visualization Dashboard\
**Last Updated**: 2025-12-28

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Operating System**: macOS 10.15+, Windows 10+, or Linux

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:

- Electron and electron-builder
- React ecosystem (React, ReactDOM, React Router)
- TypeScript
- TailwindCSS 4 and HeroUI
- SQLite (better-sqlite3)
- File watching (chokidar)
- Markdown parsing (remark ecosystem)
- Diagram libraries (ReactFlow, Recharts)

### 2. Initialize Database

The SQLite database will be created automatically on app first launch at:

- **macOS/Linux**: `~/.speckit-dash/data.db`
- **Windows**: `%USERPROFILE%\.speckit-dash\data.db`

To manually initialize or reset:

```bash
npm run db:init
```

### 3. Development Mode

Start the Electron app with hot reload:

```bash
npm run dev
```

This will:

- Launch Electron main process
- Start Vite dev server for React renderer
- Enable hot module replacement (HMR)
- Open DevTools automatically

## Project Structure

```
speckit-dash/
├── electron/                 # Electron main process
│   ├── main.ts              # Entry point
│   ├── preload.ts           # Bridge to renderer
│   └── services/
│       ├── database.ts      # SQLite service
│       ├── file-watcher.ts  # Chokidar file watching
│       └── parser.ts        # Markdown parsing
│
├── src/                      # React renderer process
│   ├── main.tsx             # React entry
│   ├── App.tsx              # Root component
│   ├── contexts/            # React Context providers
│   ├── components/          # Reusable UI components
│   ├── views/               # Page-level views
│   │   ├── StatsOverview/
│   │   ├── FeatureList/
│   │   ├── KanbanBoard/
│   │   ├── GanttTimeline/
│   │   └── Architecture/
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Frontend services (API calls)
│   └── types/               # TypeScript definitions
│
├── specs/                   # Feature specs (for testing)
│   └── 001-speckit-viz-dashboard/
│
└── package.json
```

## Running the App

### Configure First Project

1. **Launch the dashboard**: `npm run dev`
2. **Modal appears**: "Configure Project Path"
3. **Enter path**: Absolute path to your Spec-kit project (e.g.,
   `/Users/you/my-project`)
4. **Validation**: System checks for `.specify/` and `specs/` directories
5. **Success**: Dashboard loads with stats overview

### Navigate Views

- **Stats Overview** (default): See project health metrics
- **Features**: Click any feature to drill down to Kanban
- **Kanban**: View tasks by status (Not Started, In Progress, Done)
- **Gantt** (if plan.md exists): Timeline view with dependencies
- **Architecture** (if data-model.md exists): Entity diagrams

### Switch Projects

1. **Click project dropdown** (top nav)
2. **Select different project** or **Add New Project**
3. **Dashboard reloads** with new project data

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test:watch
```

### Run E2E Tests

```bash
npm run test:e2e
```

E2E tests use Playwright to automate Electron:

- Project configuration flow
- File watching and updates
- Navigation between views

## Building & Packaging

### Development Build

```bash
npm run build
```

Outputs to `dist/` directory.

### Package for Distribution

```bash
# macOS (DMG)
npm run package:mac

# Windows (NSIS installer)
npm run package:win

# Linux (AppImage)
npm run package:linux
```

Packaged apps will be in `release/` directory.

## Manual Testing Procedures

### Test 1: Project Configuration (5 min)

**Steps**:

1. Launch app with `npm run dev`
2. Enter path to valid Spec-kit project
3. Verify stats overview loads with feature count

**Expected**:

- Modal accepts valid path
- Rejects invalid path with helpful error
- Dashboard loads within 3 seconds

### Test 2: File Watching (3 min)

**Steps**:

1. With dashboard open, edit a `spec.md` file in external editor
2. Save changes
3. Observe dashboard

**Expected**:

- Dashboard updates within 5 seconds of save
- No errors in DevTools console
- Feature metadata reflects changes

### Test 3: Kanban Navigation (2 min)

**Steps**:

1. Click on any feature in feature list
2. Verify Kanban board appears
3. Check tasks are in correct columns

**Expected**:

- Smooth transition to Kanban view
- Tasks grouped by status (Not Started, In Progress, Done)
- Phase headers displayed if applicable

### Test 4: Diagram Generation (3 min)

**Steps**:

1. Navigate to a feature with `data-model.md`
2. Click Architecture view
3. Verify entity diagram renders

**Expected**:

- Entities displayed as nodes
- Relationships shown as edges
- Interactive (zoom, pan works)

## Troubleshooting

### Database Locked Error

**Symptom**: `SQLITE_BUSY: database is locked`\
**Solution**: Close all instances of the app, delete `~/.speckit-dash/data.db`,
restart

### File Watcher Not Working

**Symptom**: Changes to files not reflected in dashboard\
**Solution**:

- Check file permissions on project directory
- Restart the app
- Try toggling file watching in settings (if available)

### Build Errors

**Symptom**: Electron fails to launch after build\
**Solution**:

- Clear `node_modules/` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `npm run clean`

## Development Best Practices

### Code Style

- **Linting**: Run `npm run lint` before committing
- **Formatting**: Run `npm run format` (Prettier)
- **Type Checking**: Run `npm run type-check` (TypeScript)

### Commit Messages

Follow conventional commits format:

- `feat: add Gantt timeline view`
- `fix: resolve file watcher debounce issue`
- `docs: update quickstart guide`
- `test: add unit tests for parser service`

### Performance Profiling

Use React DevTools Profiler to identify slow renders:

```bash
# Enable profiling
REACT_APP_PROFILING=true npm run dev
```

## Next Steps

After setup:

1. **Read**: `specs/001-speckit-viz-dashboard/spec.md` for feature details
2. **Review**: `specs/001-speckit-viz-dashboard/data-model.md` for database
   schema
3. **Implement**: Follow `specs/001-speckit-viz-dashboard/tasks.md` (to be
   generated)

## Resources

- **Electron Docs**: https://www.electronjs.org/docs
- **React Docs**: https://react.dev
- **TailwindCSS**: https://tailwindcss.com/docs
- **HeroUI**: https://www.heroui.com/docs
- **ReactFlow**: https://reactflow.dev/learn
- **Recharts**: https://recharts.org/en-US/api

## Support

For issues or questions:

- Check `research.md` for technical decisions
- Review `plan.md` for architecture overview
- Consult spec.md for requirements and acceptance criteria

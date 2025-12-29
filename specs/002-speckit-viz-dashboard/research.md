# Research: Speckit Visualization Dashboard

**Feature**: Speckit Documentation Visualization Dashboard\
**Date**: 2025-12-28\
**Phase**: 0 - Technical Research & Decisions

## Technology Stack Decisions

### Desktop Framework: Electron

**Decision**: Use Electron with electron-builder for cross-platform desktop
application.

**Rationale**:

- Native file system access via Node.js APIs (required for watching .md files)
- Cross-platform support (macOS, Windows, Linux) from single codebase
- Mature ecosystem with extensive documentation and community support
- electron-builder provides streamlined packaging and distribution
- Integrates seamlessly with React for UI rendering

**Alternatives Considered**:

- **Tauri**: More lightweight but newer ecosystem, less mature tooling
- **NW.js**: Similar to Electron but smaller community and fewer resources

**Implementation Notes**:

- Use electron-builder for build/package configuration
- Separate main process (Node.js) from renderer process (React UI)
- IPC (Inter-Process Communication) for file system operations

### UI Framework: React with TypeScript

**Decision**: React 18+ with TypeScript for type-safe component development.

**Rationale**:

- Component-based architecture aligns with visualization dashboard needs
  (modular, reusable)
- TypeScript provides compile-time type safety, reducing runtime errors
- Massive ecosystem of libraries for charts, diagrams, and data visualization
- Excellent developer experience with tooling (VS Code IntelliSense)

**Alternatives Considered**:

- **Vue**: Good alternative but smaller ecosystem for desktop applications
- **Svelte**: Performance benefits but smaller community and fewer component
  libraries

**Implementation Notes**:

- Use functional components with hooks (useState, useEffect, useContext)
- Strict TypeScript configuration for maximum type safety
- Follow React best practices for performance (useMemo, useCallback for
  expensive computations)

### Styling: TailwindCSS 4

**Decision**: TailwindCSS 4 for utility-first styling.

**Rationale**:

- Utility-first approach enables rapid UI development without context switching
- Excellent dark mode support (important for developer tools)
- Small bundle size with JIT (Just-In-Time) compilation
- Integrates well with component libraries like HeroUI

**Alternatives Considered**:

- **CSS Modules**: More verbose, requires separate stylesheet files
- **Styled Components**: Runtime overhead in Electron renderer process

**Implementation Notes**:

- Configure Tailwind with custom theme tokens for brand consistency
- Use `@apply` for extracting common utility patterns into reusable classes
- Leverage Tailwind's responsive and dark mode utilities

### Component Library: HeroUI

**Decision**: HeroUI for pre-built, accessible UI components.

**Rationale**:

- Modern design system with beautiful default aesthetics
- Built-in accessibility (ARIA labels, keyboard navigation)
- TypeScript support with full type definitions
- Comprehensive component set (modals, dropdowns, tables, cards)

**Alternatives Considered**:

- **shadcn/ui**: Excellent but requires more customization work
- **Chakra UI**: Good alternative but larger bundle size

**Implementation Notes**:

- Use HeroUI components for: modals, dropdowns, tables, cards, buttons
- Customize theme to match dashboard aesthetic (dark mode default)
- Ensure form components integrate with React Hook Form for validation

### Package Manager: npm

**Decision**: npm for dependency management and scripts.

**Rationale**:

- Default package manager, broadest compatibility
- Lockfile (package-lock.json) ensures reproducible builds
- Workspaces support for potential future modularization

**Alternatives Considered**:

- **pnpm**: Faster but Electron ecosystem primarily uses npm
- **Yarn**: Similar to npm but adds another tool dependency

**Implementation Notes**:

- Use npm scripts for build, dev, test, package commands
- Leverage `npm ci` for consistent CI/CD builds

### Storage: SQLite

**Decision**: SQLite for persisting project metadata and parsed spec data.

**Rationale**:

- Embedded database, no separate server process required
- Excellent performance for local data (fast reads/writes)
- ACID compliance ensures data integrity
- Well-supported in Node.js via better-sqlite3

**Alternatives Considered**:

- **JSON files**: Simple but poor query performance, no indexing
- **LevelDB**: Key-value store, lacks SQL query capabilities

**Schema Design**:

```sql
-- Projects table: stores project paths and metadata
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  root_path TEXT UNIQUE NOT NULL,
  last_opened_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Features table: stores parsed feature specs
CREATE TABLE features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  feature_number TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'draft', 'approved', 'complete'
  spec_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, feature_number)
);

-- Tasks table: stores parsed tasks from tasks.md
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  task_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL, -- 'not_started', 'in_progress', 'done'
  phase TEXT,
  line_number INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Entities table: stores parsed entities from data-model.md
CREATE TABLE entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL,
  entity_name TEXT NOT NULL,
  description TEXT,
  attributes TEXT, -- JSON array
  relationships TEXT, -- JSON array
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX idx_features_project ON features(project_id);
CREATE INDEX idx_tasks_feature ON tasks(feature_id);
CREATE INDEX idx_entities_feature ON entities(feature_id);
```

**Implementation Notes**:

- Use better-sqlite3 for synchronous API (simpler error handling)
- Store timestamps as Unix epoch (INTEGER) for efficient querying
- JSON columns for flexible nested data (attributes, relationships)

## File Watching Strategy

**Decision**: Use chokidar for file system watching.

**Rationale**:

- Cross-platform compatibility (macOS, Windows, Linux)
- Efficient native fs.watch wrappers with fallback polling
- Debouncing and throttling built-in
- Widely used in Electron ecosystem

**Implementation Pattern**:

```typescript
import chokidar from "chokidar";

const watcher = chokidar.watch("specs/**/*.md", {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500, // Wait 500ms for write to finish
    pollInterval: 100,
  },
});

watcher.on("change", (path) => {
  // Debounced parse and update database
});

watcher.on("add", (path) => {
  // New spec file detected
});

watcher.on("unlink", (path) => {
  // Spec file deleted
});
```

## Markdown Parsing Strategy

**Decision**: Use remark ecosystem for markdown parsing.

**Rationale**:

- Industry-standard markdown processor with plugin ecosystem
- Structured AST (Abstract Syntax Tree) for reliable parsing
- Plugins available for frontmatter, GFM (GitHub Flavored Markdown), tables

**Libraries**:

- **remark**: Core markdown processor
- **remark-parse**: Markdown to MDAST parser
- **remark-frontmatter**: Extract YAML frontmatter
- **remark-gfm**: GitHub Flavored Markdown (tables, task lists)
- **unified**: AST processing pipeline

**Implementation Pattern**:

```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm);

const ast = processor.parse(markdownContent);
// Traverse AST to extract entities, tasks, requirements
```

## Diagram Generation Strategy

**Decision**: Auto-generate diagrams using React Flow for interactive node
graphs.

**Rationale**:

- Purely client-side rendering (no external services)
- Interactive diagrams (zoom, pan, node selection)
- Customizable node/edge styling
- TypeScript support

**For Entity Relationship Diagrams**:

- Parse data-model.md for entity definitions
- Create nodes for each entity
- Create edges for relationships
- Auto-layout using Dagre algorithm

**Libraries**:

- **reactflow**: Interactive node-based UI
- **dagre**: Directed graph layout algorithm

**Implementation Pattern**:

```typescript
import ReactFlow, { Edge, Node } from "reactflow";
import dagre from "dagre";

// Parse entities from data-model.md
const entities = parseDataModel(content);

// Create nodes
const nodes: Node[] = entities.map((entity, idx) => ({
  id: entity.name,
  data: { label: entity.name, attributes: entity.attributes },
  position: { x: 0, y: 0 }, // Will be calculated by dagre
  type: "entity",
}));

// Create edges from relationships
const edges: Edge[] = [];
entities.forEach((entity) => {
  entity.relationships.forEach((rel) => {
    edges.push({
      id: `${entity.name}-${rel.target}`,
      source: entity.name,
      target: rel.target,
      label: rel.type,
    });
  });
});

// Auto-layout
const layoutedElements = getLayoutedElements(nodes, edges);
```

## Chart/Graph Library

**Decision**: Recharts for progress metrics and health charts.

**Rationale**:

- React-native chart library (composable components)
- Responsive and customizable
- TypeScript support
- No canvas dependencies (uses SVG)

**Chart Types Needed**:

- Bar charts: Task completion by phase
- Line charts: Progress trends over time
- Pie/Donut charts: Feature status breakdown

## Gantt Timeline Library

**Decision**: Use React Big Calendar or similar timeline component.

**Rationale**:

- Customizable timeline view
- Supports task bars with dependencies
- TypeScript compatible

**Alternative**: Build custom timeline using HTML/CSS with positioning based on
task dates.

## Project Performance Targets

Based on success criteria from spec:

- **Load Time**: Dashboard loads in <3 seconds for 50 features (SC-002)
- **File Watch Update**: Updates within 5 seconds of file change (SC-005,
  SC-017)
- **UI Responsiveness**: 60 fps during scrolling and interaction (SC-008)
- **Gantt Render**: Render 100 tasks without lag (SC-004)

**Strategies**:

- **Virtualization**: Use react-window for long lists (feature list, task
  kanban)
- **Memoization**: useMemo for expensive parsing operations
- **Debouncing**: File watch updates debounced to 500ms
- **Lazy Loading**: Load chart libraries on-demand for respective views
- **SQLite Indexing**: Proper indexes on project_id, feature_id for fast queries

## Testing Strategy

**Unit Testing**:

- **Framework**: Vitest (fast, modern, TypeScript support)
- **Coverage Target**: ≥80% for parsing logic, database operations

**Component Testing**:

- **Framework**: React Testing Library with Vitest
- **Coverage**: All major UI components (FeatureList, KanbanBoard,
  StatsOverview)

**Integration Testing**:

- **Scope**: File watching → parsing → database update → UI render
- **Tools**: Vitest with mock file system (memfs)

**E2E Testing**:

- **Framework**: Playwright for Electron
- **Critical Paths**: Project setup, feature navigation, file watch updates

## Development Workflow

1. **Dev Mode**: `npm run dev` - Electron with hot reload
2. **Build**: `npm run build` - Production bundle
3. **Package**: `npm run package` - Create distributables for
   macOS/Windows/Linux
4. **Test**: `npm test` - Run Vitest suite

## Dependencies Summary

### Production Dependencies

- `electron`: ^28.0.0
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `better-sqlite3`: ^9.2.0
- `chokidar`: ^3.5.0
- `remark`: ^15.0.0
- `remark-parse`: ^11.0.0
- `remark-gfm`: ^4.0.0
- `reactflow`: ^11.10.0
- `dagre`: ^0.8.5
- `recharts`: ^2.10.0
- `@heroui/react`: ^latest
- `tailwindcss`: ^4.0.0

### Dev Dependencies

- `electron-builder`: ^24.9.0
- `typescript`: ^5.3.0
- `@types/react`: ^18.2.0
- `@types/node`: ^20.0.0
- `vite`: ^5.0.0
- `vitest`: ^1.0.0
- `@testing-library/react`: ^14.0.0
- `eslint`: ^8.56.0
- `prettier`: ^3.1.0

## Risk Mitigation

**Risk**: SQLite file corruption during concurrent writes\
**Mitigation**: Use WAL (Write-Ahead Logging) mode, single writer pattern

**Risk**: Large projects (100+ features) cause slow UI\
**Mitigation**: Virtualize lists, paginate database queries, lazy load views

**Risk**: Markdown parsing errors break the app\
**Mitigation**: Try-catch around parsers, show error indicators, continue with
partial data

**Risk**: Electron bundle size too large\
**Mitigation**: Code splitting, lazy load chart libraries, tree-shaking

## Next Phase

Phase 1: Generate data-model.md, contracts/, and quickstart.md based on this
research.

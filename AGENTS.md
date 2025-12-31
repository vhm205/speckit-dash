# AI Agent Integration Guide

This document provides comprehensive guidance for AI agents (like Gemini, Claude, GPT-4) working with the Speckit Dashboard codebase.

## 🎯 Project Overview

**Speckit Dashboard** is an Electron + React + TypeScript application that visualizes Spec-kit documentation with AI-powered analysis capabilities.

**Version:** 1.1.0  
**Architecture:** Electron main process (Node.js) + React renderer process  
**Database:** SQLite with WAL mode  
**AI Integration:** Vercel AI SDK with OpenAI, Ollama, and OpenRouter support

## 📂 Codebase Structure

### Directory Layout

```
speckit-dash/
├── electron/              # Backend (Electron main process)
│   ├── main.ts           # Application entry point
│   ├── preload.ts        # IPC bridge (contextBridge)
│   ├── services/         # Core backend services
│   │   ├── ai-provider.ts           # AI provider management
│   │   ├── analysis-service.ts      # AI analysis orchestration
│   │   ├── architecture-analyzer.ts # System architecture analysis
│   │   ├── database.ts              # SQLite operations
│   │   ├── feature-sync.ts          # Markdown → DB sync
│   │   ├── file-watcher.ts          # File system monitoring
│   │   ├── ipc-handlers.ts          # IPC request handlers
│   │   ├── openrouter-provider.ts   # OpenRouter integration
│   │   └── parser/                  # Markdown parsers
│   │       ├── spec-parser.ts
│   │       ├── tasks-parser.ts
│   │       ├── data-model-parser.ts
│   │       ├── plan-parser.ts
│   │       └── research-parser.ts
│   └── utils/
│       └── db-schema.sql            # Database schema definition
├── src/                  # Frontend (React renderer process)
│   ├── App.tsx          # Main React component with routing
│   ├── components/      # Reusable UI components
│   │   ├── AISettings/  # AI provider configuration UI
│   │   │   ├── index.tsx
│   │   │   ├── OpenAIConfig.tsx
│   │   │   ├── OllamaConfig.tsx
│   │   │   └── OpenRouterConfig.tsx
│   │   ├── Navbar.tsx   # Top navigation with project selector
│   │   └── ui/          # Design system components (Button, Card, etc.)
│   ├── contexts/        # React Context providers
│   │   ├── AIProviderContext.tsx   # AI provider state management
│   │   ├── ProjectContext.tsx      # Active project state
│   │   └── ThemeContext.tsx        # Dark/light theme
│   ├── hooks/           # Custom React hooks
│   │   ├── useAIAnalysis.ts        # AI analysis trigger hook
│   │   ├── useArchitecture.ts      # Architecture diagram hook
│   │   └── useSchema.ts            # Schema visualization hook
│   ├── views/           # Main application views
│   │   ├── AIAnalysis/             # AI-powered analysis UI
│   │   ├── ArchitectureView/       # System architecture diagrams
│   │   ├── FeatureList/            # Feature browser
│   │   ├── KanbanBoard/            # Task management board
│   │   ├── SchemaView/             # Data model visualization
│   │   └── StatsOverview/          # Project dashboard
│   └── types/           # TypeScript type definitions
│       ├── index.ts
│       └── ipc.ts       # IPC method signatures
└── specs/               # Example Spec-kit documentation
```

## 🔧 Key Technologies

### Frontend Stack
- **React 18.2**: UI framework
- **TypeScript 5.3**: Type safety
- **Tailwind CSS 3.4**: Utility-first styling
- **Preline 2.7**: Pre-built UI components
- **ReactFlow 11.11**: Interactive graph visualization
- **Recharts 2.10**: Statistical charts
- **React Router 6.20**: Client-side routing

### Backend Stack
- **Electron 28**: Desktop application framework
- **Better-SQLite3 9.2**: Embedded database
- **Chokidar 3.5**: File system watcher
- **Vercel AI SDK 6.0**: AI provider abstraction
- **@ai-sdk/openai 3.0**: OpenAI integration
- **Unified/Remark**: Markdown parsing ecosystem

## 🤖 AI Integration Architecture

### Provider Management

All AI provider logic is centralized in `electron/services/ai-provider.ts`.

**Supported Providers:**
1. **OpenAI** (GPT-4, GPT-3.5-turbo, etc.)
2. **Ollama** (Local AI models)
3. **OpenRouter** (100+ models through unified API)

**Key Classes:**
- `AIProviderService`: Main service coordinating all providers
- `OpenRouterProvider`: OpenRouter-specific implementation (`openrouter-provider.ts`)

### Configuration Storage

API keys are encrypted using `electron-store` before persistence:
```typescript
// electron/services/ai-provider.ts
import Store from 'electron-store';

const store = new Store({
  encryptionKey: 'your-encryption-key' // Auto-generated
});

// Encrypt before storing
const { encrypted } = encryptApiKey(config.apiKey);
store.set('openai', { encryptedApiKey: encrypted, model, ... });

// Decrypt when needed
const apiKey = decryptApiKey(stored.encryptedApiKey);
```

**Security:** API keys never reach the renderer process (frontend).

### IPC Communication Pattern

**Frontend Request:**
```typescript
// src/contexts/AIProviderContext.tsx
const configureOpenAI = async (apiKey: string, model: string) => {
  const result = await window.electronAPI.configureAIProvider({
    provider: 'openai',
    config: { apiKey, model }
  });
  return result.success;
};
```

**Backend Handler:**
```typescript
// electron/services/ipc-handlers.ts
ipcMain.handle('ai-provider:configure', async (_event, { provider, config }) => {
  try {
    if (provider === 'openai') {
      await aiProviderService.configureOpenAI(config);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

**Type Safety:**
```typescript
// src/types/ipc.ts
interface Window {
  electronAPI: {
    configureAIProvider: (args: {
      provider: 'openai' | 'ollama' | 'openrouter';
      config: OpenAIConfig | OllamaConfig | OpenRouterConfig;
    }) => Promise<IPCResponse>;
    // ... other methods
  };
}
```

### AI Analysis Flow

**1. User Triggers Analysis** (e.g., "Analyze Architecture")

**2. Frontend Hook:**
```typescript
// src/hooks/useAIAnalysis.ts
export function useAIAnalysis(featureId: number) {
  const analyzeArchitecture = async () => {
    const result = await window.electronAPI.analyzeArchitecture({
      featureId,
      force: false // Use cache if available
    });
    return result.data;
  };
  
  return { analyzeArchitecture };
}
```

**3. IPC Handler:**
```typescript
// electron/services/ipc-handlers.ts
ipcMain.handle('ai-analysis:architecture', async (_event, { featureId, force }) => {
  const result = await architectureAnalyzer.analyzeFeature(featureId, force);
  return { success: true, data: result };
});
```

**4. AI Service:**
```typescript
// electron/services/architecture-analyzer.ts
export class ArchitectureAnalyzer {
  async analyzeFeature(featureId: number, force: boolean) {
    // Check cache first
    if (!force) {
      const cached = databaseService.getArchitectureAnalysis(featureId);
      if (cached) return cached;
    }
    
    // Get active AI provider
    const provider = aiProviderService.getActiveProvider();
    const model = provider.getModel(currentModelId);
    
    // Stream AI response
    const { textStream } = await streamText({
      model,
      messages: [
        { role: 'system', content: ARCHITECTURE_SYSTEM_PROMPT },
        { role: 'user', content: featureSpec }
      ]
    });
    
    // Parse and store
    const analysis = await parseArchitectureResponse(textStream);
    databaseService.saveArchitectureAnalysis(featureId, analysis);
    
    return analysis;
  }
}
```

**5. Response Caching:**

Caching is implemented in the database schema (`architecture_analysis` table) to:
- Reduce API costs
- Improve performance
- Enable offline viewing

```sql
-- electron/utils/db-schema.sql
CREATE TABLE IF NOT EXISTS architecture_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feature_id INTEGER NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  actors TEXT NOT NULL,       -- JSON array
  systems TEXT NOT NULL,      -- JSON array
  processes TEXT NOT NULL,    -- JSON array
  data_stores TEXT NOT NULL,  -- JSON array
  connections TEXT NOT NULL,  -- JSON array
  duration INTEGER NOT NULL,
  token_count INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE
);
```

## 📝 Code Modification Guidelines

### When Adding New Features

1. **Backend Service** (`electron/services/`)
   - Add service class with pure business logic
   - Export singleton instance
   - Handle errors gracefully

2. **IPC Handler** (`electron/services/ipc-handlers.ts`)
   - Register handler in `registerIPCHandlers()`
   - Use consistent naming: `domain:action` (e.g., `ai-analysis:summarize`)
   - Return structured responses: `{ success: boolean, data?, error?, code? }`

3. **Preload Bridge** (`electron/preload.ts`)
   - Expose IPC method via `contextBridge.exposeInMainWorld`
   - Type the method in `src/types/ipc.ts`

4. **Frontend Hook** (`src/hooks/`)
   - Wrap IPC calls in custom hooks
   - Handle loading states
   - Manage errors

5. **UI Component** (`src/views/` or `src/components/`)
   - Use hooks for data fetching
   - Follow Tailwind CSS patterns
   - Ensure dark mode support

### Database Migrations

When modifying the schema:

```typescript
// electron/services/database.ts
private ensureNewColumn(): void {
  if (!this.db) return;

  const info = this.db.prepare("PRAGMA table_info(table_name)")
    .all() as Array<{ name: string }>;
  const hasColumn = info.some((col) => col.name === "new_column");

  if (!hasColumn) {
    try {
      this.db.exec("ALTER TABLE table_name ADD COLUMN new_column TEXT");
      console.log("Added new_column to table_name");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  }
}

// Call in initialize()
initialize(): void {
  // ... existing code ...
  this.ensureNewColumn();
}
```

### Testing AI Integration

**Unit Tests:**
```typescript
// tests/ai-provider.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AIProviderService } from '../electron/services/ai-provider';

describe('AIProviderService', () => {
  it('should configure OpenAI provider', async () => {
    const service = new AIProviderService();
    await service.configureOpenAI({
      apiKey: 'test-key',
      model: 'gpt-4'
    });
    
    const config = await service.getConfig();
    expect(config.openai?.hasApiKey).toBe(true);
    expect(config.openai?.model).toBe('gpt-4');
  });
});
```

**Integration Tests:**
```typescript
// tests/e2e/ai-analysis.spec.ts
import { test, expect } from '@playwright/test';

test('should analyze architecture', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('text=Features');
  await page.click('text=001-example-feature');
  await page.click('text=Architecture');
  await page.click('button:has-text("Analyze")');
  
  await expect(page.locator('.architecture-diagram')).toBeVisible();
});
```

## 🔍 Common Patterns

### Error Handling

**Backend:**
```typescript
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    code: 'OPERATION_FAILED'
  };
}
```

**Frontend:**
```typescript
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setError(null);
  const result = await window.electronAPI.doSomething();
  
  if (!result.success) {
    setError(result.error);
  }
};
```

### State Management

**Context Pattern:**
```typescript
// src/contexts/ExampleContext.tsx
interface ExampleContextValue {
  data: Data | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export function ExampleProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await window.electronAPI.getData();
    
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, []);

  return (
    <ExampleContext.Provider value={{ data, loading, error, fetch }}>
      {children}
    </ExampleContext.Provider>
  );
}
```

### React Component Structure

```typescript
// src/components/ExampleComponent.tsx
import { useState, useEffect } from 'react';
import { useExample } from '../contexts/ExampleContext';
import { Button, Card } from './ui';

export function ExampleComponent() {
  const { data, loading, error, fetch } = useExample();
  const [localState, setLocalState] = useState('');

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {data.title}
      </h2>
      {/* Component content */}
    </Card>
  );
}
```

## 🎨 UI/UX Conventions

### Dark Mode Support

Always provide dark mode variants:
```tsx
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Text</p>
  <button className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600">
    Action
  </button>
</div>
```

### Preline Components

Use Preline for dropdowns, modals, and advanced UI:
```tsx
// Dropdown
<div className="hs-dropdown relative inline-flex">
  <button className="hs-dropdown-toggle">
    Toggle
  </button>
  <div className="hs-dropdown-menu hidden">
    {/* Menu items */}
  </div>
</div>

// Initialize after mount
useEffect(() => {
  if (window.HSStaticMethods) {
    window.HSStaticMethods.autoInit();
  }
}, []);
```

### ReactFlow Diagrams

```tsx
// src/views/ArchitectureView/index.tsx
import ReactFlow, { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

export function DiagramView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // Layout with Dagre
    const layouted = getLayoutedElements(nodes, edges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={customNodeTypes}
      fitView
    />
  );
}
```

## 🔐 Security Best Practices

1. **Never expose API keys to renderer process**
   - All encryption/decryption in main process
   - Use IPC for configuration

2. **Validate all IPC inputs**
   ```typescript
   if (typeof projectId !== 'number' || projectId < 1) {
     return { success: false, error: 'Invalid project ID' };
   }
   ```

3. **Sanitize markdown content**
   - Use `rehype-raw` with caution
   - Prefer `react-markdown` with safe defaults

4. **SQL injection prevention**
   - Always use prepared statements
   - Never concatenate user input into queries

## 📊 Performance Optimization

1. **Database Indexes**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_features_project ON features(project_id);
   CREATE INDEX IF NOT EXISTS idx_tasks_feature ON tasks(feature_id);
   ```

2. **React Memoization**
   ```typescript
   const expensiveValue = useMemo(() => {
     return computeExpensiveValue(data);
   }, [data]);

   const handleClick = useCallback(() => {
     doSomething();
   }, [dependency]);
   ```

3. **Debounced File Watching**
   ```typescript
   // electron/services/file-watcher.ts
   const debouncedSync = debounce(async (filePath) => {
     await syncFeatureByPath(projectId, filePath);
   }, 300);
   ```

## 🐛 Debugging Tips

### Enable Electron DevTools
```bash
# Development mode automatically opens DevTools
npm run electron:dev
```

### View Main Process Logs
```typescript
// electron/services/*.ts
console.log('Debug info:', data);
console.error('Error occurred:', error);
```

### SQLite Debugging
```typescript
// View queries
this.db.pragma('journal_mode'); // Should be 'wal'
this.db.pragma('foreign_keys'); // Should be '1' (on)

// Inspect tables
const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);
```

### React Component Debugging
```typescript
// Use React DevTools extension
useEffect(() => {
  console.log('Component mounted with:', props);
  return () => console.log('Component unmounting');
}, []);
```

## 📚 Additional Resources

- **Electron IPC**: https://www.electronjs.org/docs/latest/tutorial/ipc
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **ReactFlow**: https://reactflow.dev/learn
- **Better-SQLite3**: https://github.com/WiseLibs/better-sqlite3
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Preline**: https://preline.co/docs

## 🤝 Contributing as an AI Agent

When making changes:

1. **Read the context**: Always check `GEMINI.md` for recent changes and patterns
2. **Follow conventions**: Maintain consistency with existing code style
3. **Type everything**: Ensure full TypeScript coverage
4. **Test your changes**: Run `npm run lint` and `npm run type-check`
5. **Document complex logic**: Add comments for non-obvious code
6. **Update this file**: If you add new patterns, document them here

---

**For human developers**: See `README.md` for general documentation.  
**For AI agents**: This document is your comprehensive integration guide.

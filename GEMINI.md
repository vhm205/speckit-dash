# speckit-dash Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-12-30

## Active Technologies

- TypeScript 5.3+ / Node.js 20+ (Electron 28) (001-speckit-ai-visualization)
- Vercel AI SDK (OpenAI & Ollama providers)
- ReactFlow (Interactive Schema & Architecture Diagrams)
- Dagre (Graph Auto-layout)

## Project Structure

```text
src/
tests/
electron/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.3+ / Node.js 20+ (Electron 28): Follow standard conventions

## Recent Changes

- 001-speckit-ai-visualization: Added AI SDK integration and ReactFlow visualization.

<!-- MANUAL ADDITIONS START -->

## Usage Patterns

### AI SDK Integration
- **Provider Management**: All AI provider logic (OpenAI/Ollama) is centralizing in `electron/services/ai-provider.ts`.
- **Hooks**: Use `src/hooks/useAIAnalysis.ts` for triggering analyses from React components.
- **Security**: API keys are encrypted before storage and never exposed to the renderer process.

### Visualization (ReactFlow)
- **Auto-layout**: Use Dagre for node positioning as seen in `src/views/ArchitectureView/layout-utils.ts`.
- **Custom Nodes**: Implement custom visuals in separate components (e.g., `EntityNode.tsx`) to maintain ReactFlow canvas performance.

<!-- MANUAL ADDITIONS END -->

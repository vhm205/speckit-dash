# OpenAI Model Filtering for SpecKit Context Analysis

## Overview

Enhanced the OpenAI provider integration to filter and prioritize models
specifically suitable for SpecKit's context analysis needs, focusing on
cost-effectiveness and capability.

## Changes Made

### 1. Backend Service (`electron/services/ai-provider.ts`)

#### New Method: `filterOpenAIModelsForContextAnalysis()`

- **Purpose**: Filters OpenAI models to include only chat completion models
  suitable for context analysis
- **Features**:
  - ✅ **Includes**: GPT-4o, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo, ChatGPT-4o
    models
  - ❌ **Excludes**: Embedding, Whisper (audio), TTS, DALL-E (image),
    moderation, instruct, and legacy completion models
  - 🎯 **Smart Sorting**: Orders models by cost-effectiveness and capability

#### Priority Order

1. **gpt-4o-mini** - Most cost-effective modern model (RECOMMENDED DEFAULT)
2. **gpt-3.5-turbo** - Cost-effective legacy model
3. **gpt-4o** - Latest, most capable (higher cost)
4. **gpt-4-turbo-preview** - High capability
5. **gpt-4-turbo** - High capability
6. **gpt-4** - Standard GPT-4

### 2. Frontend Component (`src/components/AISettings/OpenAIConfig.tsx`)

#### Updated Default Models List

```typescript
const DEFAULT_OPENAI_MODELS = [
  "gpt-4o-mini", // Most cost-effective modern model
  "gpt-3.5-turbo", // Cost-effective legacy model
  "gpt-4o", // Latest, most capable
  "gpt-4-turbo", // High capability
  "gpt-4", // Standard GPT-4
];
```

#### Updated Default Selection Logic

- Changed from `gpt-4o` to `gpt-4o-mini` as the default model
- Implements cascading fallback: `gpt-4o-mini` → `gpt-3.5-turbo` → `gpt-4o` →
  first available
- Automatically selects the most cost-effective model when fetching models from
  API

## Why This Matters

### Cost Efficiency

- **gpt-4o-mini** offers ~80% cost reduction compared to gpt-4o while
  maintaining strong performance for context analysis
- Ideal for SpecKit's use case: analyzing project specifications, documentation,
  and code structure

### Model Suitability

- Only chat completion models are suitable for SpecKit's conversational analysis
  tasks
- Filtering out embedding, audio, image, and legacy models prevents user
  confusion
- Ensures users don't accidentally select incompatible models

### User Experience

- Users see only relevant models in the dropdown
- Default selection is optimized for cost without sacrificing quality
- Automatic filtering reduces configuration errors

## Output Structure

The `testOpenAIConnection` method now returns structured data:

```typescript
{
  available: boolean,
  latency: number,
  models: string[],  // Filtered and sorted by priority
  error?: string
}
```

## Testing Recommendations

1. **Test Model Fetching**:
   - Configure OpenAI API key
   - Click "Fetch Models" in settings
   - Verify only chat completion models appear
   - Confirm gpt-4o-mini is selected by default (if available)

2. **Test Filtering**:
   - Check console logs: `Filtered X suitable models from Y total models`
   - Verify embedding, whisper, dall-e, etc. are excluded

3. **Test Fallback**:
   - If gpt-4o-mini is unavailable, gpt-3.5-turbo should be selected
   - If both unavailable, gpt-4o should be selected

## Documentation

### Configuration Comments

All filtering logic includes inline comments explaining:

- Which models are included/excluded and why
- Priority ordering rationale
- Cost-effectiveness considerations

### Logging

- Logs total models received vs. filtered models
- Logs top 5 models for debugging
- Helps diagnose API or configuration issues

## Future Enhancements

Potential improvements for consideration:

1. Add model metadata (pricing, context window, capabilities)
2. Display cost estimates in the UI
3. Allow users to set custom priority preferences
4. Cache model lists to reduce API calls
5. Add model deprecation warnings

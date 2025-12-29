# HeroUI to Preline UI Migration Guide

## Migration Status

### ✅ Completed

- **Configuration**
  - package.json - Replaced @heroui/react with preline
  - tailwind.config.js - Updated with Preline plugin and vibrant colors
  - main.tsx - Added Preline initialization

- **Core Components**
  - Providers.tsx - Removed HeroUIProvider
  - LoadingSpinner.tsx - Custom SVG spinner
  - Navbar.tsx - Preline dropdown
  - ProjectConfigModal.tsx - Custom modal

- **UI Component Library** (`src/components/ui/`)
  - Card.tsx - Card, CardHeader, CardBody
  - Button.tsx - Button with variants
  - Chip.tsx - Chip/Badge component
  - Progress.tsx - Progress bar
  - index.ts - Central exports

- **Application Components**
  - TaskCard.tsx
  - FeatureCard.tsx
  - ErrorBoundary.tsx

### 🔄 Remaining Files to Update

1. **Views** (Replace HeroUI imports with `../components/ui`):
   - `/src/views/FeatureList/index.tsx`
   - `/src/views/KanbanBoard/index.tsx`
   - `/src/views/KanbanBoard/KanbanColumn.tsx`
   - `/src/views/GanttTimeline/index.tsx`
   - `/src/views/GanttTimeline/GanttTask.tsx`
   - `/src/views/StatsOverview/index.tsx`
   - `/src/views/StatsOverview/ProjectHealthCard.tsx`
   - `/src/views/ArchitectureView/index.tsx`

## Color Scheme

### Old (HeroUI Blue/Purple)

- Primary: Sky blue (#0ea5e9)
- Accent: Magenta (#d946ef)

### New (Vibrant Purple/Cyan/Green)

- Primary: Purple (#a855f7) - main brand color
- Accent: Cyan (#06b6d4) - highlights
- Success: Emerald (#22c55e) - completed items

## Component Mapping

| HeroUI Component | Replacement                               |
| ---------------- | ----------------------------------------- |
| `Card`           | `Card` from `./ui`                        |
| `CardBody`       | `CardBody` from `./ui`                    |
| `CardHeader`     | `CardHeader` from `./ui`                  |
| `Button`         | `Button` from `./ui`                      |
| `Chip`           | `Chip` from `./ui`                        |
| `Progress`       | `Progress` from `./ui`                    |
| `Spinner`        | Custom SVG in LoadingSpinner              |
| `Modal`          | Custom modal (ProjectConfigModal pattern) |
| `Dropdown`       | Preline `hs-dropdown` classes             |
| `Navbar`         | Custom with Tailwind                      |

## Installation

Run to install new dependencies:

```bash
npm install
```

This will install:

- `preline` - Preline UI library
- `@tailwindcss/forms` - Form plugin (required by Preline)

And remove:

- `@heroui/react`
- `framer-motion` (HeroUI dependency)

## Usage Examples

### Card

```tsx
import { Card, CardBody, CardHeader } from "../components/ui";

<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>;
```

### Button

```tsx
import { Button } from "../components/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>;
```

### Chip/Badge

```tsx
import { Chip } from "../components/ui";

<Chip color="primary" variant="flat" size="sm">
  New
</Chip>;
```

### Progress

```tsx
import { Progress } from "../components/ui";

<Progress
  value={75}
  maxValue={100}
  color="success"
  label="Completion"
  showValueLabel
/>;
```

### Dropdown (Preline)

```tsx
<div className="hs-dropdown relative">
  <button className="hs-dropdown-toggle ...">
    Open Menu
  </button>
  <div className="hs-dropdown-menu ...">
    {/* Menu items */}
  </div>
</div>;
```

## Next Steps

1. Run `npm install` to install dependencies
2. Test the application
3. Update remaining view components
4. Remove any lingering @heroui references

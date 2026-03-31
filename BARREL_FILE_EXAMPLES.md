# Barrel File Issue - Code Examples

This document shows the actual problematic patterns found in the 4 files affected by the Vite 8 tree-shaking issue.

## The Pattern

The issue occurs when a barrel file (`index.ts`) combines:
1. **Imports** (especially side-effect imports like CSS, or heavy dependencies)
2. **Re-exports** from other modules

Rolldown bundles everything imported in the file, even if consumers only need the re-exported items.

---

## 1. `packages/themes/src/index.ts` ⚠️ CRITICAL

**File size:** 257 lines  
**Problem:** Imports 15+ CSS theme files, then re-exports utilities

```typescript
// Heavy imports (CSS as inline strings)
import defaultFonts from './fonts/fonts.css?inline'
import alternateTheme from './presets/alternate.css?inline'
import bluePlanetTheme from './presets/bluePlanet.css?inline'
import deepSpaceTheme from './presets/deepSpace.css?inline'
import defaultTheme from './presets/default.css?inline'
import elysiajsTheme from './presets/elysiajs.css?inline'
import fastifyTheme from './presets/fastify.css?inline'
import keplerTheme from './presets/kepler.css?inline'
import laserwaveTheme from './presets/laserwave.css?inline'
import marsTheme from './presets/mars.css?inline'
import moonTheme from './presets/moon.css?inline'
import purpleTheme from './presets/purple.css?inline'
import saturnTheme from './presets/saturn.css?inline'
import solarizedTheme from './presets/solarized.css?inline'

// Re-export (pure re-export)
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'

import { nanoid } from 'nanoid'

// Own exports using imports
export {
  alternateTheme,
  bluePlanetTheme,
  deepSpaceTheme,
  defaultTheme,
  elysiajsTheme,
  fastifyTheme,
  keplerTheme,
  marsTheme,
  moonTheme,
  purpleTheme,
  saturnTheme,
  solarizedTheme,
  laserwaveTheme,
  defaultFonts,
}

export const presets = {
  default: {
    uid: 'qTQR9jSM8E-LihpyZzPOi',
    name: 'Default',
    theme: defaultTheme,
    slug: 'default',
  },
  moon: {
    uid: 'DG9ZUNp5lJhDeX_kPX4Bl',
    name: 'Moon',
    theme: moonTheme,
    slug: 'moon',
  },
  // ... more presets
}
```

**Impact:** If a consumer only imports `hasObtrusiveScrollbars`, Rolldown still bundles ALL 15 theme CSS files because they're imported in the same file.

**Fix:**
```typescript
// presets.ts (new file)
import defaultFonts from './fonts/fonts.css?inline'
import moonTheme from './presets/moon.css?inline'
// ... all theme imports
export const presets = { ... }

// index.ts (pure re-exports only)
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'
export * from './presets'
```

---

## 2. `packages/components/src/index.ts` ⚠️ HIGH PRIORITY

**File size:** 41 lines  
**Problem:** Imports CSS, exports utilities, then re-exports all components

```typescript
import './style.css'

export { compose, cva, cx, tw, useBindCx } from '@scalar/use-hooks/useBindCx'

/** biome-ignore-start lint/performance/noReExportAll: re-exports indexes */
export * from './components/ScalarButton'
export * from './components/ScalarCard'
export * from './components/ScalarCheckboxInput'
export * from './components/ScalarCodeBlock'
export * from './components/ScalarColorModeToggle'
export * from './components/ScalarCombobox'
export * from './components/ScalarCopy'
export * from './components/ScalarDropdown'
export * from './components/ScalarErrorBoundary'
export * from './components/ScalarFileUpload'
export * from './components/ScalarFloating'
export * from './components/ScalarForm'
export * from './components/ScalarHeader'
export * from './components/ScalarHotkey'
export * from './components/ScalarIcon'
export * from './components/ScalarIconButton'
export * from './components/ScalarListbox'
export * from './components/ScalarLoading'
export * from './components/ScalarMarkdown'
export * from './components/ScalarMenu'
export * from './components/ScalarModal'
export * from './components/ScalarPopover'
export * from './components/ScalarSearchInput'
export * from './components/ScalarSearchResults'
export * from './components/ScalarSidebar'
export * from './components/ScalarTeleport'
export * from './components/ScalarTextArea'
export * from './components/ScalarTextInput'
export * from './components/ScalarThemeSwatches'
export * from './components/ScalarToggle'
export * from './components/ScalarTooltip'
export * from './components/ScalarVirtualText'
export * from './components/ScalarWrappingText'
export * from './helpers'
/** biome-ignore-end lint/performance/noReExportAll: re-exports indexes */
```

**Impact:** The CSS import causes Rolldown to bundle the styles even when only specific components are imported.

**Fix:**
```typescript
// styles.ts (new file)
import './style.css'

// index.ts (pure re-exports only)
export { compose, cva, cx, tw, useBindCx } from '@scalar/use-hooks/useBindCx'
export * from './components/ScalarButton'
// ... rest of re-exports
```

Then consumers who need styles import both:
```typescript
import '@scalar/components/styles'
import { ScalarButton } from '@scalar/components'
```

---

## 3. `packages/api-client/src/index.ts`

**File size:** 6 lines  
**Problem:** Imports CSS, then re-exports components

```typescript
import './style.css'

export { ApiClientApp, createApiClientApp } from './layouts/App'
export { type ApiClient, createApiClientModal } from './layouts/Modal'
export { useWorkspace } from './store/store'
```

**Fix:** Same as components - move CSS import to `styles.ts`

---

## 4. `packages/sidebar/src/index.ts`

**File size:** 21 lines  
**Problem:** Imports CSS, then re-exports components and utilities

```typescript
import './style.css'

export { default as HttpMethod } from './components/HttpMethod.vue'
export { default as ScalarSidebar } from './components/ScalarSidebar.vue'
export { default as SidebarHttpBadge } from './components/SidebarHttpBadge.vue'
export { default as SidebarItem } from './components/SidebarItem.vue'
export {
  type SidebarState,
  createSidebarState,
} from './helpers/create-sidebar-state'
export { generateReverseIndex } from './helpers/generate-reverse-index'
export { getChildEntry } from './helpers/get-child-entry'
export { scrollSidebarToTop } from './helpers/scroll-sidebar-to-top'
export {
  type DragOffset,
  type DraggingItem,
  type HoveredItem,
  useDraggable,
} from './hooks/use-draggable'
export type { Item } from './types.ts'
```

**Fix:** Same as components - move CSS import to `styles.ts`

---

## Why This Matters

In PR #8637, Hans manually excluded packages to prevent bundle bloat. With Vite 7 + Rollup, tree-shaking works correctly and these exclusions aren't needed. With Vite 8 + Rolldown, the mixed barrel pattern breaks tree-shaking.

**Bundle size impact:**
- Vite 8 (current): 3,950,997 bytes
- Vite 7 (PR #8637): 3,505,319 bytes (-445,678 bytes, -11.28%)

The 445 KB difference is largely due to these 4 files not tree-shaking properly.

---

## References

- Vite issue: https://github.com/vitejs/vite/issues/21966
- PR #8637: https://github.com/scalar/scalar/pull/8637
- Analysis PR: https://github.com/scalar/scalar/pull/8645

# Barrel File Issue Report - Vite 8 Tree-Shaking Problem

## Executive Summary

**Total barrel files analyzed:** 296  
**Files with mixed exports (THE ISSUE):** 4  
**Files with `export * from` (also problematic):** 11  

## The Issue

As discussed in the Slack thread and documented in [Vite issue #21966](https://github.com/vitejs/vite/issues/21966), when a barrel file (`index.ts`) mixes:

1. **Own exports** (imports + `export const`/`function`/`class`)
2. **Pure re-exports** (`export { x } from './x'`)

Rolldown (Vite 8's bundler) puts the entire barrel into a shared chunk, including heavy dependencies that only one entry needs. This breaks tree-shaking and significantly increases bundle size.

### Example of the problematic pattern:

```typescript
// packages/themes/src/index.ts
import defaultFonts from './fonts/fonts.css?inline'
import moonTheme from './presets/moon.css?inline'
// ... more imports

// Re-export from another module (pure re-export)
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'

// Own export using imported values
export const presets = {
  moon: {
    uid: 'DG9ZUNp5lJhDeX_kPX4Bl',
    name: 'Moon',
    theme: moonTheme,
    slug: 'moon',
  },
  // ...
}
```

## Files with Mixed Exports (4 files)

These files combine imports with re-exports and are affected by the tree-shaking issue:

1. **`packages/themes/src/index.ts`** (257 lines) ⚠️ **CRITICAL - Largest file, imports many CSS files**
   - Imports: CSS files for themes and fonts
   - Exports: Theme presets object, utility functions
   - Re-exports: `hasObtrusiveScrollbars` utility

2. **`packages/components/src/index.ts`** (41 lines) ⚠️ **HIGH PRIORITY - Main component entry**
   - Imports: CSS file (`./style.css`)
   - Exports: `compose`, `cva`, `cx`, `tw`, `useBindCx` utilities
   - Re-exports: All component modules via `export * from`

3. **`packages/api-client/src/index.ts`** (6 lines)
   - Imports: CSS file (`./style.css`)
   - Re-exports: Layout components and utilities

4. **`packages/sidebar/src/index.ts`** (21 lines)
   - Imports: CSS file (`./style.css`)
   - Re-exports: Components, helpers, hooks, and types

## Files with `export * from` (11 files)

These files use `export * from` which is also flagged by Biome's `noReExportAll` rule and can cause similar issues:

1. `integrations/fastify/src/index.ts` (3 lines)
2. `packages/code-highlight/src/index.ts` (6 lines)
3. `packages/code-highlight/src/markdown/index.ts` (2 lines)
4. `packages/components/src/index.ts` (41 lines) ⚠️ **High Priority**
5. `packages/object-utils/src/arrays/index.ts` (3 lines)
6. `packages/object-utils/src/mutator-record/index.ts` (4 lines)
7. `packages/object-utils/src/nested/index.ts` (2 lines)
8. `packages/object-utils/src/parse/index.ts` (2 lines)
9. `packages/object-utils/src/transforms/index.ts` (2 lines)
10. `packages/openapi-types/src/index.ts` (2 lines)
11. `packages/types/src/index.ts` (8 lines)

## Detailed Analysis

### Critical File: `packages/themes/src/index.ts`

This is the most problematic file. It imports 15+ CSS files as inline strings, exports a large `presets` object using those imports, and also re-exports a utility function:

```typescript
// Imports (heavy CSS dependencies)
import defaultFonts from './fonts/fonts.css?inline'
import moonTheme from './presets/moon.css?inline'
// ... 13+ more theme imports

// Re-export (pure re-export)
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'

// Own exports using imports
export const presets = {
  moon: { theme: moonTheme, ... },
  // ... more presets
}
```

**Impact:** When Rolldown sees this pattern, it bundles ALL theme CSS files into a shared chunk, even if only one theme is used.

### Other Affected Files

The other three files follow a similar pattern but with CSS imports:

- `packages/components/src/index.ts` - Imports `style.css`, re-exports all components
- `packages/api-client/src/index.ts` - Imports `style.css`, re-exports layouts
- `packages/sidebar/src/index.ts` - Imports `style.css`, re-exports components

## Solutions

As mentioned in the Slack thread, there are three options:

### Option 1: Downgrade to Vite 7 (Current PR #8637)
- **Pros:** Immediate fix, proven to work with Rollup, 11% smaller bundle
- **Cons:** 13% slower build time, misses Vite 8 improvements
- **Status:** PR open, waiting for decision

### Option 2: Fix the 4 barrel files
- **Pros:** Keeps Vite 8, addresses root cause, only 4 files to fix
- **Cons:** May require refactoring imports in consuming packages
- **Approach:** For each file, either:
  1. Move CSS imports to a separate file (e.g., `styles.ts`)
  2. Split own exports into dedicated files
  3. Remove re-exports and make consumers import directly

### Option 3: Update export style (as suggested by Amrit)
- **Pros:** Minimal changes per file
- **Cons:** May not fully resolve the issue
- **Approach:** Convert mixed barrels to pure re-exports by moving own exports to dedicated files

### Recommended Fix for Each File

#### 1. `packages/themes/src/index.ts` (CRITICAL)
**Option A:** Move CSS imports and presets to `presets.ts`, keep re-exports in `index.ts`
```typescript
// index.ts (pure re-exports)
export { hasObtrusiveScrollbars } from './utilities/has-obtrusive-scrollbars'
export * from './presets'

// presets.ts (own exports with imports)
import defaultFonts from './fonts/fonts.css?inline'
// ... all theme imports
export const presets = { ... }
```

**Option B:** Remove the `hasObtrusiveScrollbars` re-export, make consumers import directly

#### 2. `packages/components/src/index.ts`
Move CSS import to a separate `styles.ts`:
```typescript
// styles.ts
import './style.css'

// index.ts (pure re-exports)
export { compose, cva, cx, tw, useBindCx } from '@scalar/use-hooks/useBindCx'
export * from './components/ScalarButton'
// ... rest of re-exports
```

#### 3. `packages/api-client/src/index.ts` & `packages/sidebar/src/index.ts`
Same approach as components: move CSS import to `styles.ts`

## Recommendations

### Short Term (Immediate)
Merge PR #8637 to downgrade to Vite 7. This provides:
- 11% smaller bundle (445 KB reduction)
- Immediate fix for tree-shaking
- Proven stable solution

Trade-off: 13% slower build time (acceptable for correctness)

### Medium Term (Next Sprint)
Fix the 4 problematic barrel files:
1. **`packages/themes/src/index.ts`** - Highest impact, split CSS imports from re-exports
2. **`packages/components/src/index.ts`** - Move CSS import to `styles.ts`
3. **`packages/api-client/src/index.ts`** - Move CSS import to `styles.ts`
4. **`packages/sidebar/src/index.ts`** - Move CSS import to `styles.ts`

This allows upgrading back to Vite 8 when ready.

### Long Term
1. **Add linting rules** to prevent new mixed barrel files:
   - Enhance Biome's `noBarrelFile` rule or add custom rule
   - Detect imports + re-exports pattern
2. **Monitor upstream:** Track Vite issue #21966 for Rolldown fixes
3. **Consider:** Upgrade to Vite 8 once files are fixed

## Analysis Artifacts

- **Script:** `analyze-barrel-files.js` - Automated detection script
- **Results:** `barrel-file-analysis.json` - Detailed JSON output
- **This report:** `BARREL_FILE_ISSUE_REPORT.md`

## References

- Slack thread: #engineering, March 31, 2026
- Vite issue: https://github.com/vitejs/vite/issues/21966
- PR #8637: https://github.com/scalar/scalar/pull/8637
- Biome rule: `noBarrelFile` (error), `noReExportAll` (warn)

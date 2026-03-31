# Barrel File Issue Report - Vite 8 Tree-Shaking Problem

## Executive Summary

**Total barrel files analyzed:** 296  
**Files with mixed exports (THE ISSUE):** 37  
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

## Files with Mixed Exports (37 files)

These files combine own exports with re-exports and are affected by the tree-shaking issue:

### Integrations (2 files)
1. `integrations/express/src/index.ts` (3 lines)
2. `integrations/nestjs/src/index.ts` (3 lines)

### Packages (35 files)

#### Core API Packages
3. `packages/api-reference/src/index.ts` (15 lines) ⚠️ **High Priority**
4. `packages/api-reference-react/src/index.ts` (10 lines)
5. `packages/api-client-react/src/index.ts` (3 lines)

#### Component Library
6. `packages/components/src/components/ScalarButton/index.ts` (3 lines)
7. `packages/components/src/components/ScalarCheckboxInput/index.ts` (6 lines)
8. `packages/components/src/components/ScalarFloating/index.ts` (4 lines)
9. `packages/components/src/components/ScalarHotkey/index.ts` (4 lines)
10. `packages/components/src/components/ScalarIcon/index.ts` (4 lines)
11. `packages/components/src/components/ScalarListbox/index.ts` (6 lines)
12. `packages/components/src/components/ScalarLoading/index.ts` (4 lines)
13. `packages/components/src/components/ScalarMenu/index.ts` (13 lines)
14. `packages/components/src/components/ScalarPopover/index.ts` (3 lines)
15. `packages/components/src/components/ScalarTooltip/index.ts` (8 lines)

#### API Client
16. `packages/api-client/src/layouts/Modal/index.ts` (4 lines)
17. `packages/api-client/src/v2/blocks/operation-code-sample/index.ts` (9 lines)
18. `packages/api-client/src/v2/blocks/scalar-address-bar-block/index.ts` (3 lines)
19. `packages/api-client/src/v2/blocks/scalar-auth-selector-block/index.ts` (6 lines)
20. `packages/api-client/src/v2/features/app/index.ts` (16 lines)

#### Theme System
21. `packages/themes/src/index.ts` (257 lines) ⚠️ **High Priority - Largest File**

#### Type Definitions
22. `packages/types/src/api-reference/index.ts` (32 lines)
23. `packages/types/src/legacy/index.ts` (6 lines)
24. `packages/types/src/snippetz/index.ts` (15 lines)
25. `packages/types/src/utils/index.ts` (4 lines)

#### OpenAPI Utilities
26. `packages/oas-utils/src/entities/spec/index.ts` (63 lines) ⚠️ **High Priority**
27. `packages/openapi-parser/src/index.ts` (30 lines)

#### Other Utilities
28. `packages/agent-chat/src/index.ts` (3 lines)
29. `packages/draggable/src/index.ts` (4 lines)
30. `packages/icons/src/library/index.ts` (7 lines)
31. `packages/json-magic/src/bundle/index.ts` (3 lines)
32. `packages/nextjs-openapi/src/index.ts` (3 lines)
33. `packages/sidebar/src/index.ts` (21 lines)
34. `packages/use-codemirror/src/index.ts` (23 lines)
35. `packages/validation/src/index.ts` (38 lines)
36. `packages/workspace-store/src/events/index.ts` (16 lines)
37. `packages/workspace-store/src/navigation/index.ts` (7 lines)

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

## High Priority Files

Based on size and impact on the CDN bundle:

1. **`packages/themes/src/index.ts`** (257 lines) - Imports many CSS files and exports both the CSS strings and utility functions
2. **`packages/oas-utils/src/entities/spec/index.ts`** (63 lines) - Core OpenAPI utilities
3. **`packages/components/src/index.ts`** (41 lines) - Main component library entry point with `export *`
4. **`packages/api-reference/src/index.ts`** (15 lines) - Main API reference entry point

## Solutions

As mentioned in the Slack thread, there are three options:

### Option 1: Downgrade to Vite 7 (Current PR #8637)
- **Pros:** Immediate fix, proven to work with Rollup
- **Cons:** 13% slower build time, misses Vite 8 improvements
- **Status:** PR open, waiting for decision

### Option 2: Fix the barrel files
- **Pros:** Keeps Vite 8, addresses root cause
- **Cons:** 37+ files to refactor, may break imports
- **Approach:** Split barrel files into:
  - Pure re-export barrels (no imports)
  - Separate files for own exports

### Option 3: Update export style (as suggested by Amrit)
- **Pros:** Minimal changes per file
- **Cons:** May not fully resolve the issue
- **Approach:** Convert mixed barrels to pure re-exports by moving own exports to dedicated files

## Recommendations

1. **Short term:** Merge PR #8637 to downgrade to Vite 7 and unblock development
2. **Medium term:** Refactor the 37 problematic barrel files, starting with high-priority files
3. **Long term:** Add linting rules to prevent new mixed barrel files
4. **Monitor:** Track Vite issue #21966 for upstream fixes

## Analysis Artifacts

- **Script:** `analyze-barrel-files.js` - Automated detection script
- **Results:** `barrel-file-analysis.json` - Detailed JSON output
- **This report:** `BARREL_FILE_ISSUE_REPORT.md`

## References

- Slack thread: #engineering, March 31, 2026
- Vite issue: https://github.com/vitejs/vite/issues/21966
- PR #8637: https://github.com/scalar/scalar/pull/8637
- Biome rule: `noBarrelFile` (error), `noReExportAll` (warn)

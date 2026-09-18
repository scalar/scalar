---
'@scalar/workspace-store': minor
'@scalar/api-reference': patch
---

Read and write resolved references through a single helper. Add `createRefNode` alongside `getResolvedRef` so the `$ref-value` key lives in one place, and route the remaining direct accesses in the API reference through those helpers.

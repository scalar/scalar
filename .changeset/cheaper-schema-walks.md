---
'@scalar/workspace-store': patch
---

Make rendering from the store cheaper: the detect-changes proxy no longer allocates a path on every property read, `getResolvedRefDeep` stops deep-unpacking every node it visits, `resolve.schema` builds its composed typebox schema once, and `getExampleFromSchema` builds its options cache key once per call instead of once per node.

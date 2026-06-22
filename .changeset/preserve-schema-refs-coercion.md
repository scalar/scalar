---
'@scalar/workspace-store': patch
---

Preserve `$ref` reference objects when coercing schemas, so unresolved chunk references (from the server-side workspace store) survive instead of being dropped. This is a prerequisite for resolving lazily-loaded chunks transitively (an operation chunk can now reference component chunks).

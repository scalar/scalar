---
'@scalar/api-reference': patch
---

Introduce an internal routing helper that encapsulates URL ⇄ navigation-id translation and history writes for the active document. This is a behavior-preserving refactor that removes repeated routing boilerplate from `ApiReference.vue`.

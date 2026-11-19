---
'@scalar/workspace-store': patch
---

Fix examples for a `oneOf` or `anyOf` variant that is a nullable object or array, which came out as `null` instead of the object or array.

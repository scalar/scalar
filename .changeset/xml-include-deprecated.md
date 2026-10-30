---
'@scalar/workspace-store': patch
---

feat(workspace-store): honor `includeDeprecated` when generating and serializing XML examples, so deprecated schemas and properties can be kept in XML bodies the same way they can in JSON. The default still omits them.

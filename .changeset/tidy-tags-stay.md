---
'@scalar/openapi-upgrader': patch
---

Migrate x-tagGroups to OpenAPI 3.2 parent tags and remove the extension, preserving group names, member order, and tag metadata. Resolve group/tag name collisions with unique names and preserve group labels with summary. Warn and preserve the original tags and extension for ambiguous or malformed hierarchies so the API description can still render. Avoid mutating a document prototype during tag migration.

---
'@scalar/workspace-store': patch
'@scalar/blocks': patch
---

Keep deprecated schemas and properties in generated JSON and XML examples by default. Remove the `includeDeprecated` option; deprecation no longer filters example values. Read/write and optional-property filtering still apply.

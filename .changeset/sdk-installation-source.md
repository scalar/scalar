---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
'@scalar/schemas': patch
'@scalar/types': patch
---

Restore support for the deprecated `source` install command on `x-scalar-sdk-installation`. When set, it is appended to `description` as a fenced code block (or used on its own when there is no `description`). `description` remains the promoted field.

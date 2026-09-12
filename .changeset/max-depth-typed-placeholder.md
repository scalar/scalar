---
'@scalar/workspace-store': patch
---

Truncate deeply nested example schemas with a value of the declared type instead of the `[Max Depth Exceeded]` string, so a generated example no longer contradicts its own schema. Schemas that declare no type keep the sentinel.

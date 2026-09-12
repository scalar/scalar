---
'@scalar/workspace-store': patch
---

Truncate deeply nested examples with an empty value of the declared type — `{}`, `[]`, or a typed zero — instead of the `[Max Depth Exceeded]` string, so a truncated example no longer contradicts the type its schema declares. Schemas that declare no type keep the sentinel.

---
'@scalar/workspace-store': patch
---

Truncate deeply nested examples with an empty value of the declared type — `{}`, `[]`, or a placeholder of the declared primitive — instead of the `[Max Depth Exceeded]` string, so a truncated example no longer contradicts the type its schema declares. A declared `example`, `const` or `enum` now wins at that depth too, and schemas that describe no shape at all keep the sentinel.

---
'@scalar/api-reference': patch
---

fix: keep base allOf properties when merging oneOf/anyOf branches

When a schema used `allOf` to factor out shared object properties next to a `oneOf`/`anyOf`, each branch's own `properties`/`required` overwrote the shared base fields instead of being combined with them. The base fields now stay visible alongside each branch's own fields.

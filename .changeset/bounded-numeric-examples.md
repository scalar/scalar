---
'@scalar/workspace-store': patch
---

Generate numeric examples that respect `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, and `multipleOf`. Previously only `minimum` was used, so a schema with `maximum: 0` showed `1` and one with `exclusiveMinimum: 10` showed `10`.

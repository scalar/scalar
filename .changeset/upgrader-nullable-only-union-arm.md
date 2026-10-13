---
'@scalar/openapi-upgrader': patch
---

Upgrade a `oneOf`/`anyOf` arm that only says `nullable: true` (optionally with annotations) to `{ type: 'null' }`, so `oneOf: [{ nullable: true }, { $ref: X }]` becomes "X or null" in OpenAPI 3.1 instead of an arm that accepts any value.

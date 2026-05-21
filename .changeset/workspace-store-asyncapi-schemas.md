---
'@scalar/workspace-store': patch
---

refactor: use AsyncAPI 3.1 schemas from `@scalar/schemas`

- Remove local minimal AsyncAPI document schema definitions
- Use `asyncApiObjectSchema` from `@scalar/schemas/asyncapi/3.1` for workspace document validation
- Use `AsyncApiDocument` type from `@scalar/types/asyncapi/3.1`

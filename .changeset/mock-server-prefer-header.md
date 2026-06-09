---
'@scalar/mock-server': patch
---

Add `Prefer` header support to control mock responses: use `code=<status>` to request a specific response status and `example=<name>` to pick a named example from the `examples` map. Also adds support for the OpenAPI `examples` map (previously only the singular `example` was used).

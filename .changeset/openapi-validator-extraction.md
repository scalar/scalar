---
'@scalar/openapi-validator': minor
'@scalar/openapi-parser': minor
'@scalar/types': patch
---

Add a new `@scalar/openapi-validator` package that validates OpenAPI documents on its own. `@scalar/openapi-parser` now uses it under the hood.

Two type-level changes in `@scalar/openapi-parser` are worth noting:

- `ErrorObject.path` is now `string | string[]` instead of `string[]`. Schema errors carry a JSON Pointer string, semantic errors carry path segments — both shapes were already produced at runtime, the type just says so now. Narrow with `Array.isArray` before treating it as a list.
- The unused `ValidationOutcome` type and the internal `OpenApiDocument` alias are no longer exported.

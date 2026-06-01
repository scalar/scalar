---
'@scalar/openapi-types': patch
---

fix: allow boolean schemas in OpenAPI 3.1 types

OpenAPI 3.1 schemas are JSON Schema, where `true` and `false` are valid schemas (`true` allows any instance, `false` allows none). The `SchemaObject` type now accepts booleans anywhere a schema is expected, matching the existing 3.2 behavior.

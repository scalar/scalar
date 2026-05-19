---
'@scalar/openapi-types': patch
---

Add schema discriminator helpers (`isObjectSchema`, `isArraySchema`, `isStringSchema`, `isNumberSchema`, `isIntegerSchema`, `isNumericSchema`, `isBooleanSchema`, `isNullSchema`, `isMultiTypeSchema`, `isUntypedSchema`, `isBooleanJsonSchema`) for narrowing `SchemaObject` unions across OpenAPI 2.0, 3.0, 3.1, and 3.2.

Also tightens `MultiTypeObject` in the strict 3.1 and 3.2 schema types so that `type` is a required `PrimitiveSchemaType[]` (the single-type case is already covered by the dedicated variants), and removes `MultiTypeObject` from the strict 3.0 schema since OpenAPI 3.0 does not support multi-type schemas.

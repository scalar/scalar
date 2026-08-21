---
'@scalar/api-reference': patch
'@scalar/types': patch
'@scalar/schemas': patch
---

Preserve the schema property order from the OpenAPI document by default. The `orderSchemaPropertiesBy` option now defaults to `'preserve'` instead of `'alpha'`, so the attribute list matches the order in your document (and the example response). Set `orderSchemaPropertiesBy: 'alpha'` to keep alphabetical sorting.

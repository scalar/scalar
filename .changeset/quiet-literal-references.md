---
'@scalar/workspace-store': patch
'@scalar/json-magic': patch
---

Resolve references inside AsyncAPI Multi Format Schema Objects and OpenAPI 3.2 media type `itemSchema` fields while preserving literal schema values. Keep `schemaFormat` and `schema` annotations in ordinary JSON Schema objects as literal data.

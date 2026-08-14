---
'@scalar/openapi-upgrader': patch
---

Keep the full schema of a Swagger 2.0 `formData` parameter when upgrading to OpenAPI 3.0. The request body property was rebuilt from `type`, `description` and `format` only, so a parameter with `type: 'array'` lost its `items` and consumers of the upgraded document saw an array of unknown values. `items`, `enum`, `default` and the other validation keywords now survive.

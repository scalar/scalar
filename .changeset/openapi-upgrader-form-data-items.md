---
'@scalar/openapi-upgrader': patch
---

Keep the full schema of a Swagger 2.0 `formData` parameter when upgrading to OpenAPI 3.x. The request body property was rebuilt from `type`, `description` and `format` only, so a parameter like `{ name: 'tags', in: 'formData', type: 'array', items: { type: 'string' } }` upgraded to `{ type: 'array' }` and every consumer of the upgraded document saw an array of unknown values. The same transformation the upgrade already applies to query and path parameters now runs for form data parameters, so `items`, `enum`, `default` and the other validation keywords survive.

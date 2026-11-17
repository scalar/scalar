---
'@scalar/api-reference': minor
'@scalar/workspace-store': minor
'@scalar/json-magic': patch
'@scalar/blocks': patch
---

Resolve external RAML and Protobuf dependencies for structured AsyncAPI schema documentation, preserving source fallback when dependencies cannot be fully resolved.

Show RAML named types in schema headings instead of adding a "RAML type:" line to the description.

Show inline object item titles in array type signatures across all `@scalar/blocks` consumers, including OpenAPI documentation: an array with `items: { type: 'object', title: 'Pet' }` now displays `array of Pet` instead of `array of object`.

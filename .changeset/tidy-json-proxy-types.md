---
"@scalar/api-client": patch
"@scalar/api-reference": patch
"@scalar/blocks": patch
"@scalar/components": patch
"@scalar/helpers": patch
"@scalar/json-magic": patch
"@scalar/mock-server": patch
"@scalar/oas-utils": patch
"@scalar/openapi-parser": patch
"@scalar/openapi-upgrader": patch
"@scalar/postman-to-openapi": patch
"@scalar/pre-post-request-scripts": patch
"@scalar/release-notes": patch
"@scalar/snippetz": patch
"@scalar/workspace-store": patch
---

Replace redundant type assertions with compiler-checked annotations, typed accumulators, and existing guards across helpers, API conversion, request handling, and schema rendering.

Narrow DOM elements and caught errors before accessing their properties. Correct header lookup to include missing values and handle them during PowerShell snippet generation.

Validate release-note provider responses, represent unresolved references and absent groups in helper return types, and require narrowing merged object values. Preserve AsyncAPI broker credentials separately from HTTP authentication schemes.

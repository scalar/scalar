---
'@scalar/api-reference': patch
'@scalar/blocks': patch
'@scalar/openapi-upgrader': patch
---

Show response header examples, including media type examples and OpenAPI 3.2 cookie examples, with explicit examples taking precedence over schema examples. Preserve this precedence through composed schemas and fall back to media type examples when header examples have no usable values.

Keep external example URLs visible and preserve line breaks in displayed string examples. Across all schemas, array-level examples take precedence over item examples.

Preserve `x-example` and `x-examples` on OpenAPI 2.0 response headers during upgrades.

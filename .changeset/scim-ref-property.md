---
'@scalar/openapi-parser': patch
---

Treat an object under a `$ref` key, such as a schema property named `$ref` in SCIM documents, as a regular value instead of an invalid reference.

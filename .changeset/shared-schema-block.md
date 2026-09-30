---
'@scalar/blocks': minor
'@scalar/api-reference': patch
---

Extract the schema renderer into @scalar/blocks so other Scalar surfaces can reuse the schema tree while preserving API Reference behavior.

Keep the public API Reference Schema and SchemaProperty exports connected to extension plugins and deep-link navigation when mounted outside ApiReference.

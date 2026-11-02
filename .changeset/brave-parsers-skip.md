---
'@scalar/openapi-parser': patch
---

Reuse the JSON/YAML normalizer from `@scalar/json-magic` so JSON documents with a leading UTF-8 BOM parse correctly. Malformed JSON arrays no longer fall back to YAML parsing.

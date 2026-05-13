---
'@scalar/api-reference': patch
---

fix(api-reference): break cycles in `mergeAllOfSchemas` for self-referencing schemas (e.g. a schema whose array items `$ref` back to itself), which previously crashed the docs preview with "too much recursion"

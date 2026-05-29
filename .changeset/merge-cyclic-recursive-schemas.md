---
'@scalar/api-reference': patch
---

fix(api-reference): break cycles in `mergeAllOfSchemas` for self-referencing schemas (whether they `$ref` back to themselves through array items or through a plain object property), which previously crashed the docs preview with "too much recursion"

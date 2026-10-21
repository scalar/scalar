---
'@scalar/json-magic': patch
---

fix: keep maps such as `components.schemas` as objects when partially bundling references whose keys look like numbers (e.g. `#/components/schemas/400`)

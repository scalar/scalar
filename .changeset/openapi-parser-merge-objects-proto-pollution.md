---
'@scalar/openapi-parser': patch
---

Guard mergeObjects (used by join) against prototype pollution, so a `__proto__`, `constructor`, or `prototype` key in an input document can no longer reach Object.prototype

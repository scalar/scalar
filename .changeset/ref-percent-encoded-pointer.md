---
'@scalar/json-magic': patch
---

Resolve `$ref` pointers with percent-encoded reserved characters, so `#/paths/~1items%23list` now points at the `/items#list` path instead of resolving to nothing.

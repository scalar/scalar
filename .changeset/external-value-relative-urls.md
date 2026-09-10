---
'@scalar/json-magic': patch
'@scalar/workspace-store': patch
---

Resolve relative `externalValue` URLs on example objects against the document origin, so external request and response examples load even when referenced with a relative path

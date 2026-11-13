---
'@scalar/components': patch
'@scalar/api-reference': patch
---

fix: render server-rendered teleports in place until they are mounted, so hydrating the API reference no longer replaces elements of the host page or breaks its dropdowns

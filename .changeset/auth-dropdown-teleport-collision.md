---
'@scalar/api-client': patch
---

Fix the auth scheme dropdown not opening when multiple client apps are on the page (for example, the API reference modal). Each modal app now gets a unique id prefix, so teleport targets no longer collide and the popover renders in the visible app instead of a hidden one

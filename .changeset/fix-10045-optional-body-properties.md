---
'@scalar/workspace-store': patch
'@scalar/api-client': patch
---

Stop sending optional form-body properties by default. Optional `multipart/form-data` and `application/x-www-form-urlencoded` properties now start unchecked and are left out of the request unless you enable them, matching how optional parameters already behave. Required properties are unaffected.

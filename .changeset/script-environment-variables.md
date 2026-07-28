---
"@scalar/api-client": patch
---

Make environment variables work in pre-request and post-response scripts. `pm.environment.get()` (and `pm.variables.get()`) now read the active environment, and `pm.environment.set()` persists back to it so values like a bearer token survive to the next request. Previously the script variable store was created empty per request and discarded afterwards, so scripted reads returned `undefined` and writes were lost even though `{{variable}}` placeholders resolved correctly.

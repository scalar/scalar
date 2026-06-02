---
'@scalar/workspace-store': patch
---

fix: preserve large integer parameter values

Stop JSON-parsing primitive parameter values when building requests. Integer and number path, query, and header fields keep the exact string from the editor so values larger than Number.MAX_SAFE_INTEGER are not rounded. Array and object parameters are still parsed for OpenAPI style serialization.

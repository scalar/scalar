---
'@scalar/openapi-parser': patch
---

Normalize trailing `+` in path template parameter names during path-parameter validation so `{name+}` matches a declared `name` path parameter.

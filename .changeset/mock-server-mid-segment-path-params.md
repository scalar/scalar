---
'@scalar/mock-server': patch
---

Route path segments that mix parameters with literal text, such as `{id}.json`, `{id}:cancel` and `v{version}`, only to requests that carry the literal text, and pass their parameters to request validation, `x-handler` and `x-variable`.

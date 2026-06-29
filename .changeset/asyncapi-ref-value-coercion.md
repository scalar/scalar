---
'@scalar/schemas': patch
---

Fix AsyncAPI security scheme types being lost on ingestion. When a server referenced a scheme via `$ref`, coercion synthesized a default `$ref-value` (the first `type` literal, `userPassword`) that leaked back over the real definition through the resolved-document proxy, so every scheme rendered as `userPassword`. Reference `$ref-value` is now optional, so unresolved references pass through untouched.

---
'@scalar/openapi-to-markdown': patch
---

Resolve references and restore boolean schemas inside OpenAPI objects whose names match keywords, such as a `default` response, a header named `schema` or a callback named `example`, so their schemas render with fields and generated examples instead of `any` and `null`.

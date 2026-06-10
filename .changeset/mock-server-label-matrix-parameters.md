---
'@scalar/mock-server': minor
---

Support the `label` and `matrix` path parameter styles during request validation. Dot-prefixed `label` values (`/.1.2.3`, `/.x=1.y=2`) and semicolon-prefixed `matrix` values (`/;ids=1;ids=2`, `/;point=x,1,y,2`) are deserialized into their array or object form before validation, completing OpenAPI parameter serialization coverage for path, query, header, and cookie parameters.

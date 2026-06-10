---
'@scalar/mock-server': minor
---

Extend request validation to cover all parameter locations and serialization styles. Header (`in: header`) and cookie (`in: cookie`) parameters are now validated against their schema, with case-insensitive header matching and the `Accept`/`Content-Type`/`Authorization` headers ignored per the OpenAPI specification. Array and object parameters are deserialized by their `style`/`explode` before validation — `form`, `simple`, `spaceDelimited`, `pipeDelimited`, `deepObject`, `label`, and `matrix` — so values like `?ids=1&ids=2`, `?filter[min]=1`, or `/;point=x,1,y,2` validate against their schema instead of being rejected as a raw string. Violations are reported with a `header`, `cookie`, `path`, or `query` location.

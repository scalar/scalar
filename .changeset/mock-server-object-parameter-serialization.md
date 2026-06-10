---
'@scalar/mock-server': minor
---

Deserialize object parameters by their OpenAPI `style`/`explode` before request validation. `deepObject` (`?filter[min]=1`), exploded `form` (properties as top-level query keys), non-exploded `form`/`simple` (alternating `key,value`), and exploded `simple` (`key=value` pairs) objects are parsed into their properties so they validate against the parameter schema instead of being rejected as a raw string.

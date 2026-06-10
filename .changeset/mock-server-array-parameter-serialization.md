---
'@scalar/mock-server': minor
---

Deserialize array parameters by their OpenAPI `style`/`explode` before request validation. Exploded `form` arrays read repeated query keys (`?ids=1&ids=2`), and `form` (non-exploded), `spaceDelimited`, and `pipeDelimited` query arrays, `simple` path and header arrays, and `form` cookie arrays are split on their delimiter. Previously array parameters were validated as a single raw string, which could reject valid requests.

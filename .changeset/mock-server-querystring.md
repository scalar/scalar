---
'@scalar/mock-server': minor
---

Support OpenAPI 3.2 `in: querystring` parameters in request validation and custom handlers. Decode JSON, text, and form content from the entire query string, including inherited parameters and form property encoding.

Treat only null or undefined as absent validator schemas, preserving boolean `false` whole-query schemas that reject every value. Empty object schemas were already compiled and continue to accept unconstrained values.

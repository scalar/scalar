---
'@scalar/helpers': minor
'@scalar/workspace-store': patch
---

Add `query` as a supported HTTP method. The QUERY method (a safe, idempotent method that carries its query in the request body, per the IETF HTTP QUERY method and OpenAPI 3.2) is now part of `HTTP_METHODS`, so it is recognized by `isHttpMethod`, `normalizeHttpMethod`, and `getHttpMethodInfo` (rendered with a distinct pink badge), and it is allowed to have a request body via `canMethodHaveBody`. The workspace store now traverses and renders `query` operations on path items, so the API reference and API client handle QUERY operations correctly.

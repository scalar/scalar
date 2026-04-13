---
'@scalar/snippetz': minor
'@scalar/types': patch
'@scalar/workspace-store': patch
'@scalar/api-client': patch
'@scalar/aspire': patch
'@scalar/aspnetcore': patch
'@scalar/java-integration': patch
---

feat(snippetz): add a Laravel HTTP client plugin for PHP snippets

Added a new `php/laravel` client generator in `@scalar/snippetz`, including comprehensive request coverage for headers, cookies, auth, query params, JSON, multipart, form-encoded, binary, and fallback bodies.

Updated generated client registries and schema wiring so the new client is available across Scalar:
- `@scalar/types` `GROUPED_CLIENTS` / `AVAILABLE_CLIENTS`
- `@scalar/workspace-store` reference-config schema
- generated docs and integration client enums

Updated api-client expectations for the increased total built-in client count.

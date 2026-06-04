---
'@scalar/aspnetcore': minor
'@scalar/aspire': minor
---

feat(dotnet): add AsyncAPI document support

Adds `AddAsyncApiDocument`, `AddAsyncApiDocuments`, and `WithAsyncApiRoutePattern` so AsyncAPI documents can be registered alongside OpenAPI documents in the same Scalar API Reference. AsyncAPI documents use a separate default route pattern (`/asyncapi/{documentName}.json`) that is resolved lazily at configuration time.

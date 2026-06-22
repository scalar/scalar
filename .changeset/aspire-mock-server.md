---
'@scalar/aspire': minor
---

feat(dotnet): add `AddScalarMockServer` to run a Scalar Mock Server as an Aspire resource

Adds `AddScalarMockServer`, which registers the `scalarapi/mock-server` container as an Aspire resource that generates realistic mock API responses from an OpenAPI/Swagger document — so other resources can depend on it as if it were the real service. The document can be supplied inline (`WithDocument`), from a local file (`WithDocumentFile`), from a URL (`WithDocumentUrl`), or derived from another resource's endpoint (`WithDocumentFrom`).

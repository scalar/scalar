---
"@scalar/api-client": minor
"@scalar/api-reference": minor
"@scalar/schemas": minor
"@scalar/types": minor
"@scalar/blocks": minor
"@scalar/workspace-store": minor
"@scalar/dotnet-shared": minor
"@scalar/aspnetcore": minor
"@scalar/aspire": minor
"@scalar/aws-lambda": minor
"@scalar/azure-functions": minor
"@scalar/java-integration": minor
"scalar-fastapi": minor
"scalar-ninja": minor
---

Add an opt-in ASP.NET Core form naming mode through the API Reference configuration option `multipartNaming: "indexed-dot"`. The body editor, sent requests, and code samples use indexed dotted names such as `Certificates[0].name` for nested fields in multipart and URL-encoded request bodies.

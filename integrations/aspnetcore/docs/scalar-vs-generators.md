# `Scalar.AspNetCore`

## Historical Context

Historically, OpenAPI generators like `Swashbuckle` and `NSwag` have provided an "all-in-one" solution, bundling both the documentation generation and a UI.

With the release of .NET 9, Microsoft introduced a new OpenAPI generator, `Microsoft.AspNetCore.OpenApi`, that focuses solely on the generation aspect, without including a built-in UI. This shift has created a gap for developers who previously relied on the integrated UI.

## Scalar.AspNetCore

`Scalar.AspNetCore` is designed to bridge this gap by offering beautiful API Reference documentation. It provides a robust and customizable interface that enhances the usability and presentation of your API documentation.

For more real-world examples and detailed guides, please refer to the following guides:

- [Authentication](./authentication.md)
- [Multiple OpenAPI Documents](./multiple-openapi-documents.md)
- [Multiple Scalar API References](./multiple-scalar-api-references.md)
- [SubPath Deployment](./subpath-deployment.md)
# Import

The API Client supports several formats to get your API collections into the app. To import, click **Add Item** (⌘ K or Control K) and select **Import from OpenAPI/Swagger/Postman/cURL**.

## Formats

### OpenAPI 3.x

The native format used internally by the API Client. OpenAPI documents can be auto-generated from your codebase or hand-written. Both JSON and YAML are supported.

This is the recommended format. All features of the API Client, including environments, authentication schemes, and server configuration, map directly to the OpenAPI specification.

### Swagger 2.0

Swagger 2.0 files are automatically upgraded to OpenAPI 3.1 on import. You do not need to convert them beforehand.

### Postman Collections

Import Postman Collection files (v2.0 / v2.1) as a one-off import. Requests, folders, and basic authentication settings are converted to an OpenAPI-based collection.

### cURL

Paste a cURL command to create a single request. The API Client parses the method, URL, headers, and body from the command.

```bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane"}'
```

### AsyncAPI

We do not currently support AsyncAPI for the API Client. The client is built around OpenAPI operations — a request, a method, a response — while an [AsyncAPI](../../asyncapi.md) document describes channels and the messages that flow over them, so AsyncAPI documents are skipped rather than imported into a collection.

You can still read one as an [API reference](../../asyncapi.md), which renders its channels, operations, and message payloads.

Need it? Tell us on [GitHub](https://github.com/scalar/scalar/issues/new) or email [support@scalar.com](mailto:support@scalar.com).

## Sources

You can import from different sources:

- **URL** — Provide a link to a hosted OpenAPI document. The API Client fetches and imports it directly.
- **File** — Drag and drop a local file, or browse to select one from your file system.
- **Development environment** — Point to your local development server to sync with an API running on localhost.

## Start from scratch

You do not need to import anything to get started. Create an empty collection and add requests manually as you go.

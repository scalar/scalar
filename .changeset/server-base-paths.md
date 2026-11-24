---
"@scalar/mock-server": patch
---

Serve OpenAPI operations under the base path of their servers, so `GET /v1/pets` answers when the document declares `servers: [{ url: 'https://api.example.com/v1' }]`. OpenAPI 2.0 `basePath`, relative server URLs, and every enum value of a server variable in the path are served too, and operation and path item servers take precedence over the servers of the document. Operations keep answering at their bare path keys.

Descriptions that exceed the server URL expansion or generated route budget continue serving their bare operation routes.

---
'@scalar/mock-server': patch
'@scalar/json-magic': patch
---

Harden the mock server against SSRF and local file disclosure through OpenAPI `$ref`s. External `$ref` resolution now refuses to fetch private, loopback, link-local, and metadata addresses, and confines local file reads to the document's directory. The `fetchUrls` and `readFiles` bundling plugins gain opt-in `blockPrivateNetworks` and `basePath` options, so other callers keep their current behavior unless they opt in.

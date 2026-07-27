---
'@scalar/workspace-store': patch
---

fix: honor document level `x-scalar-secret-*` extensions on apiKey and http security schemes

OAuth flows already read their secrets from the OpenAPI document, but the apiKey and http branches only looked at the auth store and at the config input fields (`value`, `token`, `username`, `password`). A token declared as `x-scalar-secret-token` directly on the security scheme was therefore ignored, and the request kept rendering the `YOUR_SECRET_TOKEN` placeholder. Both branches now follow the same precedence as the OAuth flows: auth store, then the document extension, then the config field.

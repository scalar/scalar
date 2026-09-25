---
"@scalar/mock-server": patch
"@scalar/mock-server-docker": patch
---

Restrict AsyncAPI external references to the source directory and public network addresses, and preserve the source location for preloaded documents.

URL inputs to `createAsyncApiMockServer` also reject private network addresses, including localhost. Load local files or pass preloaded document content for local development. Docker documents supplied through `OPENAPI_DOCUMENT` resolve relative references from their temporary `/tmp/openapi.json` or `/tmp/openapi.yaml` file, confined to `/tmp`. Both OpenAPI and AsyncAPI Docker documents preserve the selected source origin.

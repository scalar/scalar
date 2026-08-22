---
'@scalarapi/docker-api-reference': patch
---

fix: detect and serve mounted AsyncAPI documents

The document scanner only recognized OpenAPI/Swagger files, so AsyncAPI documents mounted into `/docs` were silently skipped. AsyncAPI files (`.json`/`.yaml`/`.yml` with an `asyncapi` version field) are now detected and included in the generated configuration with `documentType: "asyncapi"`.

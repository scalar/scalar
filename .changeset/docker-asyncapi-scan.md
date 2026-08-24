---
'@scalarapi/docker-api-reference': minor
---

fix: detect and serve mounted AsyncAPI documents

The document scanner only recognized OpenAPI/Swagger files, so AsyncAPI documents mounted into `/docs` were silently skipped. AsyncAPI files (`.json`/`.yaml`/`.yml` with an `asyncapi` version field) are now detected and included in the generated configuration.

The scanner also produces deterministic output: documents are now scanned in sorted order, so the default document no longer depends on the filesystem's directory order, and filenames containing special characters (quotes, backslashes, tabs) are escaped correctly so the generated configuration stays valid JSON.

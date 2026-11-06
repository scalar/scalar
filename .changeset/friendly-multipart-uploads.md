---
'@scalar/api-client': minor
'@scalar/workspace-store': patch
'@scalar/types': patch
---

Add schema-aware file controls for multipart/mixed and multipart/related parts, preserving part order and encodings. Restrict multipart/form-data uploads to file fields when a request body schema is available.

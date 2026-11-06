---
'@scalar/api-client': minor
'@scalar/workspace-store': patch
'@scalar/types': patch
---

Add schema-aware file controls for multipart/mixed and multipart/related parts, preserving part order and encodings. Restrict multipart/form-data uploads to file fields when a request body schema is available.

Honor binary encoding content types on multipart fields and share file-schema detection with example generation, including nullable, composed, and typeless file placeholders.

---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
---

Load native AsyncAPI RAML and Protobuf dependencies when their message or model is expanded, sharing authenticated downloads until the document changes and preserving source fallback and prebuilt server resources.

Use the containing document location for deferred dependencies and prevent remote schemas from invoking a filesystem loader.

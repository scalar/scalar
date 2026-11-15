---
'@scalar/postman-to-openapi': patch
---

fix: wrap saved response bodies in an example object

Saved Postman responses were written straight into `examples.default`, so the converted document failed OpenAPI 3.1 validation and tools reading `examples.default.value` got nothing. The body now goes into `value`, the same way request body examples already work. Non-JSON bodies are kept as plain strings instead of `{ rawContent }` objects.

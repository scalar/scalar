---
'@scalar/workspace-store': patch
---

Honor OpenAPI 3.2 `dataValue` and `serializedValue` examples for multipart part headers. Serialize structured header values using simple style and preserve explicit falsy examples and serialized text.
Use schema fallbacks for null examples and omit the header when no value is available.

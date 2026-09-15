---
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-reference': minor
'@scalar/helpers': minor
'@scalar/blocks': patch
'@scalar/sidebar': patch
'@scalar/snippetz': patch
---

Support OpenAPI 3.2 additionalOperations in operation storage, navigation, documentation, callbacks, and the API client. Preserve custom HTTP method spelling when displaying and sending requests and generating code samples.

Traversed operation methods now accept custom strings. Unknown method presentation uses `colorClass` and `colorVar`, matching known methods. Preserve uppercase and mixed-case additional operation names consistently.

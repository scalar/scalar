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

Traversed operation and webhook methods now use the exported `OperationMethod` type, which accepts custom strings while retaining known-method editor completion. Consumers must handle unknown methods; this open type cannot provide exhaustive checking over the fixed HTTP method set. Unknown method presentation uses `colorClass` and `colorVar`, matching known methods. Preserve uppercase and mixed-case additional operation names consistently.

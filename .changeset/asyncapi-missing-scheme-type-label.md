---
'@scalar/api-client': patch
'@scalar/api-reference': patch
---

Name the actual document type in the "security scheme is missing a type" warning. When a scheme has no recognizable type, the auth selector previously always told users to check their "OpenAPI document", even for AsyncAPI documents. The warning now reflects the document it belongs to (e.g. "AsyncAPI") via a new optional `documentType` prop on the auth selector block, defaulting to `openapi`. Schemes that carry a valid but unsupported type (such as AsyncAPI broker types like `userPassword` or `scramSha256`) now show a dedicated "not supported yet" message naming the type, instead of the misleading "missing a type" warning.

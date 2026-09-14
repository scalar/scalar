---
'@scalar/workspace-store': patch
'@scalar/api-reference': patch
'@scalar/api-client': patch
'scalar-app': patch
---

Use OpenAPI 3.2 schemas throughout workspace-store consumers, stories, tests, and type generation. Update the app editor to offer OpenAPI 3.2 validation and completion while continuing to accept existing 3.1 documents.

Preserve OpenAPI 3.2 fields in the loose workspace schema, including tag hierarchy, streaming media types, nested encoding, additional operations, and OAuth device authorization.

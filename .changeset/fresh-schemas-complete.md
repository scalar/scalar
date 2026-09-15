---
'@scalar/workspace-store': minor
'@scalar/api-reference': patch
'@scalar/api-client': patch
'scalar-app': patch
---

Use OpenAPI 3.2 schemas throughout workspace-store consumers, stories, tests, and type generation. Update the app editor to offer OpenAPI 3.2 validation and completion while continuing to accept existing 3.1 documents.

Preserve OpenAPI 3.2 fields in the loose workspace schema, including tag hierarchy, streaming media types, nested encoding, additional operations, and OAuth device authorization.

The editor intentionally offers the 3.2 field set to documents declaring 3.1 as well; it does not flag 3.2-only fields solely because the declared version is 3.1. Remove the unused 3.1 loose-schema generator to prevent schema drift.

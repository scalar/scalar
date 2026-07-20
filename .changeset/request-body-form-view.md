---
'@scalar/api-client': minor
'@scalar/workspace-store': minor
---

feat: add a switchable form view for JSON and YAML request bodies

When a request body's content type is JSON or YAML and its schema (or the current example) describes an object, a "Form / Raw" toggle now appears next to the content type selector. The form view renders one row per schema property — with enum dropdowns, required badges, defaults, and per-field validation, matching the existing `multipart/form-data` editor — and folds edits back into a nested object using the schema's declared types (numbers, booleans, arrays, and nested objects survive the round-trip instead of becoming strings). The raw code editor remains the default and is unaffected for non-object bodies or unparseable text.

`@scalar/workspace-store` gains reusable exports for this: `buildDottedNestedRowPredicate`, `coerceLeafValueToSchemaType`, `coerceUntypedValue`, and `resolveLeafSchema` from `@scalar/workspace-store/request-example`, factored out of the existing multipart request-body builder.

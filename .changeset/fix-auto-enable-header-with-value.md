---
'@scalar/api-client': patch
---

fix(api-client): auto-enable optional header/query/cookie rows that have a pre-populated value

Optional parameters (headers, query params, cookies) start disabled by default. When the OpenAPI
spec provides a default or enum value for such a parameter (e.g. `x-scenario-id` with an enum),
the row was rendered with its checkbox unchecked even though a value was already selected — so the
parameter was silently dropped from every request until the user manually checked it.

The fix auto-enables any row that is only disabled by default (no explicit `x-disabled: true`) and
already carries a non-empty value, mirroring the existing behaviour when a user types a value into
a previously-empty row.

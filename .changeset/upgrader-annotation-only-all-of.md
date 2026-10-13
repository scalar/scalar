---
'@scalar/openapi-upgrader': patch
---

Collapse `allOf` members that only carry annotations when upgrading from OpenAPI 3.0 to 3.1. OpenAPI 3.0 ignores keywords next to a `$ref`, so exporters write `allOf: [{ $ref: X }, { description, example }]` to document a reference. OpenAPI 3.1 allows those keywords next to a `$ref`, so the upgrade now writes `{ $ref: X, description, examples }` instead of a two-member composition. A named component keeps its `allOf` wrapper, so it stays a subtype of its base, and so does any schema another `$ref` points at or through.

The 3.0 to 3.1 upgrade also no longer skips the `default` entry of a Responses Object, which it mistook for the `default` keyword, so schemas in a default response are upgraded too.

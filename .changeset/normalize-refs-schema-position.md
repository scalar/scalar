---
'@scalar/workspace-store': patch
'@scalar/helpers': patch
---

Only normalize OpenAPI Reference Objects during bundling, never Schema Objects. `normalizeRefs` used to strip every sibling except `$ref` on any node outside `components/schemas`, which also hit inline schemas. In JSON Schema 2020-12 a `$ref` may legally carry sibling keywords — for example a `$defs`/`$dynamicAnchor` binding that specializes a generic template like `Paginated<T>` — and such schemas appear inline anywhere a schema is allowed (a response's `content.<media>.schema`, an `allOf` branch, …). Dropping those siblings discarded the binding, leaving `$dynamicRef` to resolve to the template's empty fallback and rendering an empty array (for example the `data` array of `GET /planets` in the Scalar Galaxy). Reference Objects are still normalized as before. A new `@scalar/helpers/openapi/is-schema-path` helper detects schema positions.

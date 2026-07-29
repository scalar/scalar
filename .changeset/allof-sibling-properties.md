---
"@scalar/api-reference": patch
---

Keep sibling `properties` when flattening a single-member `allOf`. Previously, a schema declaring its own `properties` next to an `allOf` holding a single `$ref` lost those sibling properties: the referenced schema's `properties` overwrote them instead of being combined, and the referenced schema's `title`/`description` replaced the parent's. Sibling and inherited properties now render together, `required` lists are unioned, and the parent schema's own annotations win over the base it extends.

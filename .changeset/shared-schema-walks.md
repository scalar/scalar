---
'@scalar/api-reference': patch
---

Reuse the schema walks behind the reference rows. Resolving a `$ref`, flattening a composition for display, splitting an `allOf` into segments and merging an `allOf` are now kept per schema node and reused by every row and page that shows the same schema, instead of being repeated for each one. Each cached result is checked against a signature of the values it was built from, so a document edited in place is walked again.

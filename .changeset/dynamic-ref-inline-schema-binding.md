---
'@scalar/workspace-store': patch
---

Keep JSON Schema 2020-12 reference keywords (`$id`, `$anchor`, `$dynamicAnchor`, `$dynamicRef`, `$defs`) on an inline schema `$ref` during bundling. A generic template like `Paginated<T>` binds its item type through a `$defs`/`$dynamicAnchor` sibling next to the `$ref`, and that wrapper can appear inline on a response schema rather than under `components/schemas`. The normalization step previously stripped every sibling except `$ref` outside `components/schemas`, discarding the binding so `$dynamicRef` resolved to the template's empty fallback and the generated example rendered an empty array (for example the `data` array of `GET /planets` in the Scalar Galaxy).

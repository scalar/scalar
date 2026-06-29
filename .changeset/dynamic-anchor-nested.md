---
'@scalar/workspace-store': patch
---

Resolve `$dynamicRef` against `$dynamicAnchor` declarations nested anywhere inside a schema resource, not just at the root or in `$defs`. An anchor sitting under `properties`, `allOf`, `items` and similar keywords is now collected too, so generic/recursive templates that place their binding deeper resolve to the concrete type instead of an empty shape. Nested `$id` resources and `$ref` targets are still left to be collected at their own location.

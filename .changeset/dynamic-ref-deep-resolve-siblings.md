---
'@scalar/workspace-store': patch
---

Preserve keywords declared alongside a `$ref` when deeply resolving references, so a `$defs`/`$dynamicAnchor` binding (the `Paginated<T>` pattern) survives and `$dynamicRef` can resolve to the bound item type instead of falling back to an empty result

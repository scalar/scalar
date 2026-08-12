---
'@scalar/api-reference': patch
---

Fix empty `$dynamicRef` array items in the Models section. A model that binds a
generic template's item type through a `$ref` sibling `$defs` (a named
`Paginated<User>`) lost that binding while resolving the schema for display, so
the item rendered empty. The model now keeps the binding and shows the bound type.

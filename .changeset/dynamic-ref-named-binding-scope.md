---
'@scalar/workspace-store': patch
---

Render `$dynamicRef` array items when the binding schema is referenced by name.
A response that used `$ref: '#/components/schemas/PaginatedUserResponse'` (rather
than an inline `$id`/`$defs` binding) hid the resource's `$dynamicAnchor` behind
the `$ref`, so the dynamic scope never grew and the item type rendered empty.
`pushDynamicScope` now follows a bare `$ref` to reach the named binding resource.

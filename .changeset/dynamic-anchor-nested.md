---
'@scalar/blocks': patch
'@scalar/json-magic': minor
'@scalar/workspace-store': patch
---

Resolve JSON Schema 2020-12 `$dynamicRef` inside the magic proxy. The proxy now threads the dynamic scope as a document is walked and exposes the bound schema through a virtual `$dynamicRef-value` property (mirroring `$ref-value`), so consumers no longer assemble the scope themselves. Anchors are collected anywhere inside a schema resource — not just at the root or in `$defs`, but also nested under `properties`, `allOf`, `items` and similar keywords — so generic and recursive templates that place their binding deeper resolve to the concrete type instead of an empty shape. Active dynamic scopes use a stable scope-keyed proxy cache, so a shared template referenced from several bindings resolves to the right type per path. Ordinary anchor-free resources retain their shared proxy identity even when another branch uses dynamic references.

Rendering also binds a `$dynamicRef` that is an object property (not only array items) to its concrete type, so those properties no longer show up unresolved.

Expose the dynamic-reference accessor through `@scalar/workspace-store/resolve` so the schema renderer does not depend directly on json-magic at runtime.

Resolve references declared directly on a schema resource against that resource’s own anchors, including when the resource has no matching anchor.

The bookend for a `$dynamicRef` is looked up in the whole resource that holds it, so a template with unrelated `$defs` still binds. A schema reached through a `$ref` contributes its own anchors even when the path passed through an `$id` resource, which keeps recursive references (such as a `User` with `friends`) bound. Dynamic references added to a document after it was first read (lazily loaded chunks, client edits) now resolve too, and request examples bookend the same way as the rendered schema.

XML serialization also resolves resource-level dynamic references against their own scope, so it does not borrow an outer binding across a resource boundary. Sibling references only merge plain schema objects, leaving non-schema targets unchanged.

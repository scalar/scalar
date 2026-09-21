---
'@scalar/api-reference': patch
'@scalar/json-magic': patch
'@scalar/workspace-store': patch
---

Resolve JSON Schema 2020-12 `$dynamicRef` inside the magic proxy. The proxy now threads the dynamic scope as a document is walked and exposes the bound schema through a virtual `$dynamicRef-value` property (mirroring `$ref-value`), so consumers no longer assemble the scope themselves. Anchors are collected anywhere inside a schema resource — not just at the root or in `$defs`, but also nested under `properties`, `allOf`, `items` and similar keywords — so generic and recursive templates that place their binding deeper resolve to the concrete type instead of an empty shape. Active dynamic scopes use a stable scope-keyed proxy cache, so a shared template referenced from several bindings resolves to the right type per path. Ordinary anchor-free resources retain their shared proxy identity even when another branch uses dynamic references.

Rendering also binds a `$dynamicRef` that is an object property (not only array items) to its concrete type, so those properties no longer show up unresolved.

Expose the dynamic-reference accessor through `@scalar/workspace-store/resolve` so API Reference does not depend directly on json-magic at runtime.

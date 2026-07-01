---
'@scalar/json-magic': patch
'@scalar/workspace-store': patch
---

Resolve JSON Schema 2020-12 `$dynamicRef` inside the magic proxy. The proxy now threads the dynamic scope as a document is walked and exposes the bound schema through a virtual `$dynamicRef-value` property (mirroring `$ref-value`), so consumers no longer assemble the scope themselves. Anchors are collected anywhere inside a schema resource — not just at the root or in `$defs`, but also nested under `properties`, `allOf`, `items` and similar keywords — so generic and recursive templates that place their binding deeper resolve to the concrete type instead of an empty shape. The proxy cache is bypassed only while a dynamic scope is active, so a shared template referenced from several bindings resolves to the right type per path while ordinary documents are unaffected.

---
'@scalar/workspace-store': patch
---

Follow chains of references when resolving. A reference can point at a second reference — `resolve()` on a static or SSR workspace leaves the component behind as a `{ $ref: '#/x-ext/<hash>', $global: true }` stub with the content under `x-ext` — so `getResolvedRef` and `getResolvedRefDeep` now hop through references that carry nothing but a `$ref` until they reach the node itself, instead of handing back the stub. A reference that carries keywords of its own stays its own hop, since it is a schema in its own right.

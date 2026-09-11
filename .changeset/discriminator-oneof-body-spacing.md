---
'@scalar/api-reference': patch
---

Render a body-level discriminator `oneOf` flush under its selector. When a `oneOf`/`anyOf` variant `allOf`s back to a shared base — the shape a `discriminator.mapping` infers, and the one a request body most often carries — the merged variant renders one level deeper than a plain object variant and picked up an extra row of padding, so its first field sat detached below the selector instead of flush under it like a plain `oneOf`.

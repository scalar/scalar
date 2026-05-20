---
'@scalar/validation': patch
---

fix(validation): detect cycles when scoring union branches

`scoreUnion` (used by `coerce` to pick the best matching `union` branch) now tracks the `(value, schema)` pairs that are live on its call stack and returns a neutral positive score on re-entry. A recursive lazy schema such as `lazy(() => union([object({ child: optional(lazy(() => T)) }), …]))` evaluated against a self-referential value previously caused `scoreUnion` to recurse through `lazy → union → object → property → lazy → …` indefinitely and overflow the stack, contradicting the rest of the cycle-handling work. The marker is cleared in `finally` so sibling union branches that share a schema reference are scored independently.

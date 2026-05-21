---
'@scalar/validation': patch
---

fix(validation): do not leak cycle-detection cache across union branches

Scope the in-progress `(value, schema)` cache used by `validate` to the live call stack instead of treating it as run-wide memoization. The marker for each pair is now cleared before the call returns, so a shared schema reference that failed in one `union` branch (for example the common `base` in `union([intersection([base, objA]), intersection([base, objB])])`) is re-validated in the next branch rather than short-circuiting to `true` from a stale entry. Cycle detection on self-referential and mutually recursive lazy graphs is unaffected because the marker is still present during recursive descent into the same value.

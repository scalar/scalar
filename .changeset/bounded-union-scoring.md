---
'@scalar/validation': patch
---

Bound how deep union scoring looks into a value, so `coerce` no longer takes exponential time on recursive unions. `coerce` now also stops at a nesting depth of 1,000 calls instead of overflowing the stack. It leaves deeper values unchanged and logs a warning.

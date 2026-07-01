---
'@scalar/workspace-store': patch
---

Keep `$ref-value` optional in the shared `reference()` schema helper. An unresolved `{ $ref }` (for example a sparse chunk from the server store) now passes through coercion untouched instead of being coerced into a synthesized default that dropped the reference. This aligns the helper with the schema position that already made this choice.

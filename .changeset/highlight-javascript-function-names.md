---
'@scalar/highlight': patch
---

Fix JavaScript comparisons read as generic calls, and keep compiled grammars when a grammar is registered again

An identifier followed by `<` read as the start of a generic call, so `count` in `if (count <= max)` and `b` in `b <= 10` were painted as function names. The generic branch now requires a type argument list that closes and is followed by `(`, so `useState<number>(0)` still scopes and a comparison does not.

`registerLanguage` also evicted a grammar's compiled form whenever it was called, even with the grammar already registered under every one of its names. A caller that registers on every render recompiled on every render, which cost close to twenty times the highlight itself. Registering the same grammar again is now a no-op.

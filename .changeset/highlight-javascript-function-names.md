---
'@scalar/highlight': patch
---

Fix JavaScript function-name scoping

An identifier followed by `<` read as the start of a generic call, so `count` in `if (count <= max)`, `b` in `b <= 10` and the text `hi` in `<button>hi</button>` were all painted as function names. The generic branch now requires an argument list that closes and is followed by `(`, so `useState<number>(0)` still scopes while a comparison does not.

A name bound to a function also went unscoped, because only a name sitting directly in front of a `(` was recognised. `const compare = (a, b) => …`, `const greet = function () {}` and the `async` and single-parameter forms now scope the name as a function, the way `function compare() {}` already did.

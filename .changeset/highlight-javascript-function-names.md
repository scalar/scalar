---
'@scalar/highlight': patch
---

Fix JavaScript function-name and JSX scoping

An identifier followed by `<` read as the start of a generic call, so `count` in `if (count <= max)`, `b` in `b <= 10` and the text `hi` in `<button>hi</button>` were all painted as function names. The generic branch now requires an argument list that closes and is followed by `(`, so `useState<number>(0)` still scopes while a comparison does not.

A name bound to a function also went unscoped, because only a name sitting directly in front of a `(` was recognised. `const compare = (a, b) => …`, `const greet = function () {}` and the `async` and single-parameter forms now scope the name as a function, the way `function compare() {}` already did.

JSX element text is left alone as well. Everything between an opening and a closing tag ran through the expression rules, so the prose in `<button>Click me to open the Api Client</button>` had every capitalised word painted as a type, and `</button>` was picked apart into three operators rather than read as a closing tag — a tag can only open where the character before `<` is not a letter, which is exactly what a closing tag has in front of it. Children are now their own state: text stays unscoped, nested elements and `{…}` interpolations still work, and the closing tag is scoped like the opening one.

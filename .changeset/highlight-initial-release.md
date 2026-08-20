---
'@scalar/highlight': minor
---

Add `@scalar/highlight`, a zero-dependency syntax highlighter. A grammar is plain data describing a small state machine, each state compiles to one merged regular expression, and rendering goes straight to an HTML string without allocating token objects. Languages are separate modules, so importing `python` does not cost you `scala`.

Entry points are `.` (`highlight`, `highlightBlock`, `tokenize`, the registry and the scope vocabulary), `./core` for the engine alone, `./all` and `./lazy` for eager and code-split registration, `./langs/*` for a single grammar, `./style.css` for the stylesheet, and `./compat`, a drop-in for `@scalar/code-highlight`'s `syntaxHighlight` that emits the same `hljs-*` markup. Nothing currently consumes it — this only adds the package.

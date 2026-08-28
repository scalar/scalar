---
'@scalar/highlight': minor
---

Add `toHast` to `@scalar/highlight/compat`, which highlights into hast element content rather than an HTML string.

`syntaxHighlight` is the right tool when the destination is HTML. A rehype plugin is the case it does not serve: handing back markup there means parsing it straight back into nodes. `toHast` returns the nodes directly, and `null` for a language with no registered grammar, so a caller can tell "nothing to highlight" from "highlighted to nothing" and leave the block alone.

Adjacent ranges resolving to the same class merge into one span, matching the string renderer — our scope vocabulary is finer than highlight.js's, so `keyword.declaration` followed by `keyword` has to arrive as a single `hljs-keyword` element rather than two siblings lowlight would never have produced. The tests hold both renderers to the same output span for span across the whole sample corpus, so the two cannot drift.

No runtime dependency is added: the hast types are type-only.

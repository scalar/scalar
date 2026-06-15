---
'@scalar/code-highlight': minor
'@scalar/components': patch
---

Switch code block syntax highlighting to Shiki, loaded lazily.

Only the Shiki core and the JavaScript regex engine load up front. Each language grammar is fetched on demand the first time it is needed (and cached afterwards), so a page only ever downloads the grammars it actually highlights. Token colors are produced by a Shiki theme that maps to Scalar's existing CSS variables, so light/dark/custom themes keep working with no visual changes.

`syntaxHighlight` is now async (it returns a `Promise<string>`) and no longer takes a `languages` option, since grammars are resolved and loaded internally.

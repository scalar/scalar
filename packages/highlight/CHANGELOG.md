# @scalar/highlight

## 0.2.0

### Minor Changes

- [#9923](https://github.com/scalar/scalar/pull/9923): Add `@scalar/highlight`, a zero-dependency syntax highlighter. A grammar is plain data describing a small state machine, each state compiles to one merged regular expression, and rendering goes straight to an HTML string without allocating token objects. Languages are separate modules, so importing `python` does not cost you `scala`.

  Entry points are `.` (`highlight`, `highlightBlock`, `tokenize`, the registry and the scope vocabulary), `./core` for the engine alone, `./all` and `./lazy` for eager and code-split registration, `./langs/*` for a single grammar, `./style.css` for the stylesheet, and `./compat`, a drop-in for `@scalar/code-highlight`'s `syntaxHighlight` that emits the same `hljs-*` markup. Nothing currently consumes it — this only adds the package.

### Patch Changes

- [#9913](https://github.com/scalar/scalar/pull/9913): Add Julia (HTTP.jl) as a code example target. The new `julia/http` client generates HTTP.jl snippets, including headers, query parameters, cookies, basic auth, JSON bodies (as `Dict`s serialized with `JSON.json`), url-encoded bodies and `HTTP.Form` multipart uploads. Julia syntax highlighting and a Julia icon are included, so the client shows up in the code example picker like any other language.

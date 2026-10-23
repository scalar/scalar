---
'@scalar/highlight': minor
---

Ship the `hljs-*` stylesheet as `@scalar/highlight/compat/code.css`

This is the `code.css` that `@scalar/code-highlight` used to ship, moved next to the compat layer whose classes it styles. It carries one fix: `line-height` now sits on `code.hljs` itself rather than on `:where(code.hljs) *`. That selector reaches elements and never text nodes, so a line of entirely unscoped text — the content between two JSX tags, for example — carried no element and rendered about two pixels shorter than its neighbours. Line numbers hid this, because that mode wraps every line in an element.

`@scalar/code-highlight` is deprecated. Its code half lives in `@scalar/highlight/compat` and its Markdown half in `@scalar/markdown`.

---
'@scalar/highlight': minor
---

Ship the `hljs-*` stylesheet as `@scalar/highlight/compat/code.css`

This is the `code.css` that `@scalar/code-highlight` ships, unchanged, moved next to the compat layer whose classes it styles. Import `@scalar/highlight/compat/code.css` instead of `@scalar/code-highlight/css/code.css`.

Scalar's own packages no longer use `@scalar/code-highlight`. Its code half has a replacement in `@scalar/highlight/compat` and its Markdown half in `@scalar/markdown`.

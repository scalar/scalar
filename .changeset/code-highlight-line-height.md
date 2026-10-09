---
'@scalar/code-highlight': patch
---

Fix a code line rendering shorter than its neighbours when nothing on it is highlighted

`line-height` was declared on `:where(code.hljs) *`, which reaches elements and never text nodes. A highlighter emits a token span only where it has a scope to give, so a line of entirely unscoped text — the content between two JSX tags, for example — carried no element, fell back to the surrounding line height, and rendered about two pixels shorter than the lines around it.

Line numbers hid this. That mode wraps every line in `span.line`, which is an element, so the same block rendered evenly with a gutter and unevenly without one. The declaration now sits on `code.hljs` itself, so it sets the line box for every line and the spans inherit it.

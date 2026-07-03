---
'@scalar/code-highlight': patch
---

fix: keep rendering Markdown when a code block fails to highlight

Syntax highlighting is now best-effort: if a highlight.js grammar throws at runtime (for example a Unicode regex that a production minifier mangles), the code block falls back to plain text instead of the error taking down the whole Markdown section.

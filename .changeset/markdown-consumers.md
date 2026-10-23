---
'@scalar/components': patch
'@scalar/api-reference': patch
'@scalar/openapi-to-markdown': patch
---

Render Markdown through `@scalar/markdown` instead of `@scalar/code-highlight`

None of them pull in lowlight or highlight.js any more: code blocks in descriptions are highlighted by `@scalar/highlight`, the same highlighter `ScalarCodeBlock` uses. A fenced code block without a language is no longer auto-detected. It is highlighted only when it is unmistakably JSON, HTML/XML or a `curl` command, and renders as plain text otherwise.

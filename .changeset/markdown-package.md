---
'@scalar/markdown': minor
---

Add `@scalar/markdown`, the Markdown half of the former `@scalar/code-highlight`

`htmlFromMarkdown`, `getHeadings`, `splitContent`, `isHeading`, `textFromNode`, `rehypeAlert` and `rehypeHighlight` move here unchanged in name and signature. Code blocks are now highlighted by `@scalar/highlight` rather than lowlight, with the same `hljs` and `hljs-*` classes, so `code.css` keeps styling them.

One behaviour changes: a fenced code block without a language is no longer auto-detected. highlight.js guessed a language for it, often wrongly; it now renders as plain text, keeping the `hljs` class so it still looks like every other code block.

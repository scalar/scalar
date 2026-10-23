---
'@scalar/markdown': minor
---

Add `@scalar/markdown`, a replacement for the Markdown half of `@scalar/code-highlight`

`htmlFromMarkdown`, `getHeadings`, `splitContent`, `isHeading`, `textFromNode` and `rehypeAlert` move here unchanged in name and signature. `rehypeHighlight` keeps its name and its `className` option; the options that configured lowlight (`lowlight`, `languages`, `aliases`, `subset`, `plainText`, `prefix` and `detect`) have no equivalent. Code blocks are now highlighted by `@scalar/highlight` rather than lowlight, with the same `hljs` and `hljs-*` classes, so `code.css` keeps styling them.

One behaviour changes: a fenced code block without a language is no longer auto-detected. highlight.js guessed a language for it, often wrongly. Now it is highlighted only when the guess is certain (JSON that parses, HTML/XML markup, or a `curl` command) and renders as plain text otherwise, keeping the `hljs` class so it still looks like every other code block.

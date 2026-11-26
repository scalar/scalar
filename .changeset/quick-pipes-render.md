---
'@scalar/markdown': minor
---

feat: render Markdown with a purpose-built parser instead of unified, remark and rehype

`htmlFromMarkdown`, `getHeadings` and `splitContent` produce the same DOM with about 6× less JavaScript and many times faster rendering. The HTML is no longer formatted with indentation and surrounding newlines. The unified renderer stays available from `@scalar/markdown/renderer`.

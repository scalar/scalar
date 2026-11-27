---
'@scalar/markdown': minor
'@scalar/openapi-to-markdown': patch
'@scalar/asyncapi-to-markdown': patch
---

feat: convert Markdown without unified, remark, rehype or parse5

`parseMarkdown`, `mdastFromHtml` and `createMarkdownSerializer` now run on the same parser and HTML tokenizer as `htmlFromMarkdown`, with a port of `mdast-util-to-markdown` for serializing. Copy as Markdown no longer bundles the unified stack, so the API Reference's `standalone.js` gets smaller. Reference-style links in descriptions become inline links, line endings are always LF, short table rows are filled to the header's width, and emphasis is written so that it parses back as emphasis.

The copied Markdown also no longer contains raw HTML or links where the old serializer let escaped text through: code blocks inside HTML table cells, emphasis or headings, text before the first item of an HTML list, inline code values with blank lines, empty and adjacent code spans, link URLs that start with `<`, upper case `HTTPS://` text, and link text that a table or nested list in a tight list cut off.

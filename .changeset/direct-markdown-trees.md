---
'@scalar/openapi-to-markdown': major
---

Generate Markdown directly from a Markdown syntax tree, avoiding Vue server rendering and the generated HTML conversion pipeline. Reuse normalized schemas and parsed descriptions across pages while preserving selection, reference resolution, and raw HTML description sanitization.

Remove `createHtmlFromOpenApi` and `renderer.renderHtml`. Use `createMarkdownFromOpenApi` or `renderer.render` instead. Markdown list spacing and escaping may differ from previous output.

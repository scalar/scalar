---
'@scalar/openapi-to-markdown': minor
'@scalar/workspace-store': patch
---

Preserve chained path-item references with non-enumerable links.

Remove the HTML output APIs `createHtmlFromOpenApi` and `renderer.renderHtml` from `@scalar/openapi-to-markdown`. Use `createMarkdownFromOpenApi` or `renderer.render` and convert the resulting Markdown with an application-provided renderer when HTML is needed.

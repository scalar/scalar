---
'@scalar/openapi-to-markdown': patch
---

Reduce large-document conversion memory by loading a read-only API description and rendering operations and schemas sequentially. Compile server rendering templates and avoid whole-document HTML-to-Markdown syntax trees.

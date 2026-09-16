---
'@scalar/openapi-to-markdown': patch
---

Reduce large-document conversion memory by loading a plain API description without an editable workspace or document proxies, rendering operations and schemas sequentially, and compiling server rendering templates. Avoid redundant HTML minification for Markdown and bundle a fix that reuses whitespace element predicates instead of recreating them per node.

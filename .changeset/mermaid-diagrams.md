---
'@scalar/code-highlight': minor
'@scalar/components': minor
---

feat: render Mermaid diagrams embedded in markdown

Mermaid fenced code blocks (` ```mermaid `) in OpenAPI descriptions (and anywhere `ScalarMarkdown` is used) are now rendered as diagrams instead of plain code blocks. Mermaid is loaded lazily, so it is only downloaded when a document actually contains a diagram, and diagrams re-render to match the active light/dark color mode.

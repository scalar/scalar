---
'@scalar/api-reference': minor
'@scalar/components': minor
'@scalar/helpers': patch
'@scalar/types': minor
'@scalar/schemas': minor
'@scalar/mermaid-plugin': minor
---

Add per-reference Markdown rendering hooks and an explicitly loaded Mermaid plugin with interactive diagrams, keyboard panning, and zoom controls.

Provide Markdown hooks before mounting the embedded client modal so its initial render receives the configured hooks. The Mermaid viewer uses customizable Scalar theme styles and an intentional light drawing surface.

Isolate Markdown plugin cleanup failures so other plugins still release their resources when content changes or unmounts.

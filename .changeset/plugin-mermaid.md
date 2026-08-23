---
'@scalar/plugin-mermaid': minor
---

feat: add @scalar/plugin-mermaid, an optional plugin that renders `x-mermaid` specification extensions as Mermaid diagrams via the existing plugin API. Mermaid is a dependency of this package only and is dynamically imported at render time, so the core `@scalar/api-reference` bundle is unaffected unless a consumer installs and registers this plugin.

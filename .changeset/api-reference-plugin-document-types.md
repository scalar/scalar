---
'@scalar/api-reference': minor
'@scalar/types': minor
---

Add `documentTypes` to the API Reference plugin API, so a plugin can teach API Reference a document format it does not support natively. The plugin detects its documents, builds their sidebar entries and renders them with its own component, while API Reference handles loading, the document selector, routing and the sidebar.

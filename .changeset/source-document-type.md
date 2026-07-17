---
'@scalar/schemas': minor
'@scalar/types': minor
---

feat: add an optional `documentType` field (`'openapi' | 'asyncapi'`) to the source configuration

Sources can now declare their document type explicitly, e.g. `sources: [{ url: '/asyncapi.json', documentType: 'asyncapi' }]`. The field is a forward-compatible hint: the renderer keeps auto-detecting the type from the document content, so it stays optional.

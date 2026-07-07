---
'@scalar/api-reference': patch
'@scalar/types': patch
'@scalar/schemas': patch
---

Add a read-only accessor for the global authentication state to the plugin API. Plugin lifecycle hooks (`onInit`, `onConfigChange`) now receive an `auth` accessor alongside `config`, and the plugin manager exposes `getAuthState()` for view components. Plugins can read stored secrets and the selected security schemes via `auth.export()`, `auth.getAuthSecrets(documentName, schemeName)`, and `auth.getAuthSelectedSchemas(payload)` without being able to mutate auth.

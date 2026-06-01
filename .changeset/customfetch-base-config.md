---
'@scalar/types': patch
'@scalar/schemas': patch
'@scalar/api-client': patch
---

Move `customFetch` from `apiReferenceConfigurationSchema` to `baseConfigurationSchema` so it is shared between the API Reference and the API Client

---
'@scalar/api-reference': patch
---

fix: forward `configuration.fetch` to the API client so "Test Request" calls use the custom fetch (enabling things like `credentials: 'include'`), not only the OpenAPI document load

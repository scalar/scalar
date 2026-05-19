---
'@scalar/api-reference': patch
'@scalar/schemas': patch
'@scalar/types': patch
---

feat: add `customFetch` to the api-reference configuration and forward it to the API client so requests (including "Test Request" calls) use the custom fetch — enabling things like `credentials: 'include'`. The previous `fetch` option is deprecated and migrated automatically with a console warning.

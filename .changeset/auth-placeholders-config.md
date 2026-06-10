---
'@scalar/types': minor
'@scalar/api-reference': patch
'@scalar/api-client': patch
---

feat: add `authentication.placeholders` configuration option

Adds a new `placeholders` field to the `authentication` configuration that allows customizing placeholder text for auth input fields (API key value, API key name, bearer token, username, password).

Previously, placeholder values were hardcoded and could not be changed without DOM manipulation. This change enables users to configure them declaratively:

```ts
{
  authentication: {
    placeholders: {
      apiKeyValue: 'Enter your API key',
      bearerToken: 'Enter your token',
    },
  },
}
```

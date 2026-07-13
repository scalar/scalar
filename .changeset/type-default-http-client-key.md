---
'@scalar/types': patch
'@scalar/schemas': patch
---

Type the `defaultHttpClient` config against the real client ids. `targetKey` and `clientKey` were plain `string`, so there was no autocomplete and no error when the value was wrong — for example passing the display title `'Fetch'` instead of the client id `'fetch'`, which silently did nothing. They are now typed to the actual targets and clients, in both the `@scalar/types` and `@scalar/schemas` definitions.

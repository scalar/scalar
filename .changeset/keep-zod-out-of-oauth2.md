---
'@scalar/api-client': patch
---

Stop the OAuth2 auth form from loading Zod. It only needed the list of PKCE methods, but importing that list from `@scalar/types/entities` also built that module's Zod schemas, which kept all of Zod in the initial bundle of the API Reference. Drop the unused `zod` dependency.

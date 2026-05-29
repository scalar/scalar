---
'@scalar/workspace-store': minor
'@scalar/api-client': patch
'@scalar/api-client-react': patch
'@scalar/api-reference': patch
---

refactor: extract the code example block into `@scalar/blocks/code-example`. `api-client`, `api-client-react`, and `api-reference` now import `CodeExample`, `findClient`, `generateClientOptions`, and the related helpers from the new package. `workspace-store` exports `isParamDisabled` with an optional `defaultDisabled` argument.

---
'@scalar/blocks': minor
'@scalar/workspace-store': minor
'@scalar/api-client': minor
'@scalar/api-client-react': patch
'@scalar/api-reference': patch
---

refactor: extract the code example block into `@scalar/blocks/code-example`. `api-client`, `api-client-react`, and `api-reference` now import `CodeExample`, `findClient`, `generateClientOptions`, and the related helpers from the new package. `workspace-store` exports `isParamDisabled` with an optional `defaultDisabled` argument.

**Breaking (`@scalar/api-client`):** the `@scalar/api-client/blocks/operation-code-sample` and `@scalar/api-client/v2/blocks/operation-code-sample` export paths have been removed. Import from `@scalar/blocks/code-example` instead, and use the renamed `CodeExample` / `CodeExampleProps` (previously `OperationCodeSample` / `OperationCodeSampleProps`).

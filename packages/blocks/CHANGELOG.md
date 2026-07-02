# @scalar/blocks

## 0.1.2

## 0.1.1

### Patch Changes

- [#9610](https://github.com/scalar/scalar/pull/9610): Only show required parameters in code examples. Optional query, header, and cookie parameters are now omitted from the generated request snippets unless they are explicitly enabled via the `x-disabled: false` extension.

## 0.1.0

### Minor Changes

- [#8519](https://github.com/scalar/scalar/pull/8519): refactor: extract the code example block into `@scalar/blocks/code-example`. `api-client`, `api-client-react`, and `api-reference` now import `CodeExample`, `findClient`, `generateClientOptions`, and the related helpers from the new package. `workspace-store` exports `isParamDisabled` with an optional `defaultDisabled` argument.

  **Breaking (`@scalar/api-client`):** the `@scalar/api-client/blocks/operation-code-sample` and `@scalar/api-client/v2/blocks/operation-code-sample` export paths have been removed. Import from `@scalar/blocks/code-example` instead, and use the renamed `CodeExample` / `CodeExampleProps` (previously `OperationCodeSample` / `OperationCodeSampleProps`).

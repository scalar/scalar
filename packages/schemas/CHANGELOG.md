# @scalar/schemas

## 0.3.0

### Minor Changes

- [#9264](https://github.com/scalar/scalar/pull/9264): feat: add AsyncAPI 3.1 validation schemas and `@scalar/schemas/asyncapi/3.1` export
- [#9297](https://github.com/scalar/scalar/pull/9297): feat: add asyncapi extensions

### Patch Changes

- [#9295](https://github.com/scalar/scalar/pull/9295): refactor: flatten AsyncAPI 3.1 schemas and validate resolved references
  - Remove per-schema `create*` factories; export flat schemas using `recursiveRef` directly
  - Add `asyncApiResolvedReference` for reference-only fields (`operation.channel`, `channel.servers`, `operation.reply`, and similar) so `$ref-value` is always validated
  - Export `asyncApiObjectSchema` directly and use it for generated `AsyncApiDocument` types

- [#9299](https://github.com/scalar/scalar/pull/9299): refactor: flatten and split OpenAPI 3.1 schemas into separate files
- [#9169](https://github.com/scalar/scalar/pull/9169): feat: add `customFetch` to the api-reference configuration and forward it to the API client so requests (including "Test Request" calls) use the custom fetch — enabling things like `credentials: 'include'`. The previous `fetch` option is deprecated and migrated automatically with a console warning.
- [#9294](https://github.com/scalar/scalar/pull/9294): refactor: move the schemas to the schemas folder and generate the types from schemas
- [#9292](https://github.com/scalar/scalar/pull/9292): refactor: move extensions to the schema package

## 0.2.0

### Minor Changes

- [#9211](https://github.com/scalar/scalar/pull/9211): feat: write custom schemas for api-reference configuration

## 0.1.0

### Minor Changes

- [#8844](https://github.com/scalar/scalar/pull/8844): feat: write custom schemas for api-reference configuration

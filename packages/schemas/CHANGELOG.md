# @scalar/schemas

## 0.3.3

### Patch Changes

- [#9309](https://github.com/scalar/scalar/pull/9309): feat: add `modelsSectionLabel` configuration (`'Models' | 'Schemas' | string`) to use OpenAPI-style Schemas terminology in the sidebar, content, and search.
- [#9383](https://github.com/scalar/scalar/pull/9383): fix: preserve multi-type schema arrays when coercing schemas with validation keywords
- [#7618](https://github.com/scalar/scalar/pull/7618): feat(api-reference): add `setPageTitle` to customize the browser tab title

  Pass a `setPageTitle` function to control the browser tab title. It is called whenever the section in view changes — on sidebar clicks, on scroll, and when switching documents — and receives the section title and the active OpenAPI document:

  ```js
  setPageTitle: ({ title, document }) => `${document.title} – ${title}`
  ```

## 0.3.2

### Patch Changes

- [#9313](https://github.com/scalar/scalar/pull/9313): feat: add AsyncAPI connection URL builder and server list helpers

## 0.3.1

### Patch Changes

- [#9311](https://github.com/scalar/scalar/pull/9311): feat: add typed AsyncAPI WebSocket binding schema
  - Add `asyncApiWsBindingObject` for `bindings.ws` with `method`, `query`, `headers`, and `bindingVersion`
  - Add `asyncApiSchemaObjectOrReference` (Schema Object | Reference Object) for WebSocket binding fields that exclude Multi Format Schema Object
  - Regenerate `@scalar/types/asyncapi/3.1` types

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

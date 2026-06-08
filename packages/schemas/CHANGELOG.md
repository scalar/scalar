# @scalar/schemas

## 0.4.0

### Minor Changes

- [#9398](https://github.com/scalar/scalar/pull/9398): feat: read code samples from x-readme, x-stainless and x-scalar extensions

  In addition to `x-codeSamples`, the code sample picker now reads custom samples from `x-scalar-examples`, `x-stainless-snippets`, `x-stainless-examples`, and `x-readme.code-samples`. When more than one is present on an operation, the highest-priority source is used (x-scalar-examples > x-stainless-snippets > x-stainless-examples > x-readme > x-codeSamples).

- [#9422](https://github.com/scalar/scalar/pull/9422): Add a `nonce` option for Content Security Policy support.

  When you pass a `nonce`, the rendered HTML stamps it onto the inline `<script>` and the CDN `<script>` tag (and Scalar's own `<style>` tags, plus a matching `<meta property="csp-nonce">`). This lets the API Reference run under a strict `script-src` with no `unsafe-inline` and no `unsafe-eval`.

  ```ts
  ApiReference({
    url: '/openapi.json',
    // Match this value in your `script-src` CSP directive.
    nonce: 'r4nd0m',
  })
  ```

  Note: `style-src` still needs `'unsafe-inline'`. The reference renders inline `style="…"` attributes, which a CSP nonce can never authorize (nonces only apply to `<script>`, `<style>` and `<link>` elements), so a nonce-only `style-src` is not possible. The win is a fully strict `script-src`.

- [#9400](https://github.com/scalar/scalar/pull/9400): feat(api-reference): add `expandAllSchemaProperties` config option.

  When enabled, nested schema properties are expanded by default while keeping the
  "Show/Hide Child Attributes" button available for manual collapsing. Expansion
  is cycle-safe: every finite branch is expanded fully, and self-referential
  ($ref or inline) schemas stop at the point they would otherwise recurse forever.

- [#9399](https://github.com/scalar/scalar/pull/9399): Show custom SDK installation instructions from `x-scalar-sdk-installation` in the introduction card, falling back to the client selector when there are none. Each entry takes a `lang` and a Markdown `description`, so a single tab can render rich instructions with syntax-highlighted code blocks (for example Maven and Gradle for Java)

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

# @scalar/schemas

## 0.7.2

### Patch Changes

- [#9639](https://github.com/scalar/scalar/pull/9639): Add a read-only accessor for the global authentication state to the plugin API. Plugin lifecycle hooks (`onInit`, `onConfigChange`) now receive an `auth` accessor alongside `config`, and the plugin manager exposes `getAuthState()` for view components. Plugins can read stored secrets and the selected security schemes via `auth.export()`, `auth.getAuthSecrets(documentName, schemeName)`, and `auth.getAuthSelectedSchemas(payload)` without being able to mutate auth.

## 0.7.1

### Patch Changes

- [#9626](https://github.com/scalar/scalar/pull/9626): Fix AsyncAPI security scheme types being lost on ingestion. When a server referenced a scheme via `$ref`, coercion synthesized a default `$ref-value` (the first `type` literal, `userPassword`) that leaked back over the real definition through the resolved-document proxy, so every scheme rendered as `userPassword`. Reference `$ref-value` is now optional, so unresolved references pass through untouched.

## 0.7.0

### Minor Changes

- [#9597](https://github.com/scalar/scalar/pull/9597): Add API Reference UI localization configuration with built-in English, Russian, Spanish, French, German, Simplified Chinese and Arabic translations, including automatic RTL direction for Arabic locales.

  Update the shared theme reset so text inputs align to the logical start by default for RTL documents.

  Add a `mergeObjects` deep-merge helper to `@scalar/helpers`, used by the localization layer to merge translation overrides onto the built-in locale.

- [#9543](https://github.com/scalar/scalar/pull/9543): Add the `x-scalar-links` OpenAPI extension to render extra named links (like a privacy policy or imprint) next to the contact, license and terms of service links in the introduction.

### Patch Changes

- [#9577](https://github.com/scalar/scalar/pull/9577): Stop marking the per-source `title` and `slug` as deprecated. They are the supported way to name a document and its URL when using multiple `sources`, so the deprecation note (and editor strike-through) was misleading.

## 0.6.0

### Minor Changes

- [#9515](https://github.com/scalar/scalar/pull/9515): feat: add `requestBuilt` client plugin hook and `onRequestBuilt` configuration callback that receive the exact fetch `Request` that is sent over the wire

  The hook runs after the request has been built, right before it is sent. Header mutations apply to the outgoing request and the body bytes match what the server receives, which makes request signing possible: hashing the body of a rebuilt `multipart/form-data` request would produce a different multipart boundary than the request that is actually sent.

## 0.5.0

### Minor Changes

- [#9478](https://github.com/scalar/scalar/pull/9478): Add `content.start` plugin view slot and `sidebar` visibility option for plugin view components.
  - **`content.start`**: A new view slot that renders custom plugin components **before** the Introduction/Info section (at the top of the content area).
  - **`sidebar` option on `ViewComponent`**: Plugins can now opt-in to display a sidebar entry for their custom views by providing `sidebar: { show: true, label: 'My Page' }`. Omitting `sidebar` or setting `show: false` hides the entry from the sidebar. The entry hooks into the existing navigation, so clicking it scrolls to the plugin view and it highlights as it scrolls into view.

### Patch Changes

- [#9529](https://github.com/scalar/scalar/pull/9529): Remove the unused `isLoading` configuration option. It was never wired to a consumer, so it had no effect on the rendered references.
- [#9528](https://github.com/scalar/scalar/pull/9528): Remove the unused `onSpecUpdate` configuration option. It was never wired to a consumer, so the callback never fired.

## 0.4.3

### Patch Changes

- [#9342](https://github.com/scalar/scalar/pull/9342): fix: resolve operations when OpenAPI path items use `$ref`

  Path entries and webhooks can reference `components.pathItems` instead of inlining operations. Navigation, mutators, search, and markdown export now resolve path-item references before reading HTTP methods and path-level parameters.

## 0.4.2

### Patch Changes

- [#9471](https://github.com/scalar/scalar/pull/9471): Restore support for the deprecated `source` install command on `x-scalar-sdk-installation`. When set, it is appended to `description` as a fenced code block (or used on its own when there is no `description`). `description` remains the promoted field.

## 0.4.1

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

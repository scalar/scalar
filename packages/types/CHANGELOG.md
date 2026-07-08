# @scalar/types

## 0.16.2

### Patch Changes

- [#9639](https://github.com/scalar/scalar/pull/9639): Add a read-only accessor for the global authentication state to the plugin API. Plugin lifecycle hooks (`onInit`, `onConfigChange`) now receive an `auth` accessor alongside `config`, and the plugin manager exposes `getAuthState()` for view components. Plugins can read stored secrets and the selected security schemes via `auth.export()`, `auth.getAuthSecrets(documentName, schemeName)`, and `auth.getAuthSelectedSchemas(payload)` without being able to mutate auth.

## 0.16.1

### Patch Changes

- [#9630](https://github.com/scalar/scalar/pull/9630): Render AsyncAPI tags without the extra horizontal indentation on nested channels, and replace the empty "Operations" card in an AsyncAPI tag header with a "Channels" card that lists the channels in the tag.

## 0.16.0

### Minor Changes

- [#9597](https://github.com/scalar/scalar/pull/9597): Add API Reference UI localization configuration with built-in English, Russian, Spanish, French, German, Simplified Chinese and Arabic translations, including automatic RTL direction for Arabic locales.

  Update the shared theme reset so text inputs align to the logical start by default for RTL documents.

  Add a `mergeObjects` deep-merge helper to `@scalar/helpers`, used by the localization layer to merge translation overrides onto the built-in locale.

### Patch Changes

- [#9577](https://github.com/scalar/scalar/pull/9577): Stop marking the per-source `title` and `slug` as deprecated. They are the supported way to name a document and its URL when using multiple `sources`, so the deprecation note (and editor strike-through) was misleading.

## 0.15.0

### Minor Changes

- [#9515](https://github.com/scalar/scalar/pull/9515): feat: add `requestBuilt` client plugin hook and `onRequestBuilt` configuration callback that receive the exact fetch `Request` that is sent over the wire

  The hook runs after the request has been built, right before it is sent. Header mutations apply to the outgoing request and the body bytes match what the server receives, which makes request signing possible: hashing the body of a rebuilt `multipart/form-data` request would produce a different multipart boundary than the request that is actually sent.

## 0.14.0

### Minor Changes

- [#9478](https://github.com/scalar/scalar/pull/9478): Add `content.start` plugin view slot and `sidebar` visibility option for plugin view components.
  - **`content.start`**: A new view slot that renders custom plugin components **before** the Introduction/Info section (at the top of the content area).
  - **`sidebar` option on `ViewComponent`**: Plugins can now opt-in to display a sidebar entry for their custom views by providing `sidebar: { show: true, label: 'My Page' }`. Omitting `sidebar` or setting `show: false` hides the entry from the sidebar. The entry hooks into the existing navigation, so clicking it scrolls to the plugin view and it highlights as it scrolls into view.

### Patch Changes

- [#9529](https://github.com/scalar/scalar/pull/9529): Remove the unused `isLoading` configuration option. It was never wired to a consumer, so it had no effect on the rendered references.
- [#9528](https://github.com/scalar/scalar/pull/9528): Remove the unused `onSpecUpdate` configuration option. It was never wired to a consumer, so the callback never fired.

## 0.13.3

### Patch Changes

- [#9342](https://github.com/scalar/scalar/pull/9342): fix: resolve operations when OpenAPI path items use `$ref`

  Path entries and webhooks can reference `components.pathItems` instead of inlining operations. Navigation, mutators, search, and markdown export now resolve path-item references before reading HTTP methods and path-level parameters.

## 0.13.2

### Patch Changes

- [#9471](https://github.com/scalar/scalar/pull/9471): Restore support for the deprecated `source` install command on `x-scalar-sdk-installation`. When set, it is appended to `description` as a fenced code block (or used on its own when there is no `description`). `description` remains the promoted field.

## 0.13.1

## 0.13.0

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

### Patch Changes

- [#9438](https://github.com/scalar/scalar/pull/9438): feat(api-reference): add an AsyncAPI server selector

  Adds a server selector for AsyncAPI documents in the API reference introduction. It mirrors the OpenAPI server selector but works with the AsyncAPI server shape (a named map of `host`/`protocol`/`pathname`), labelling each server with its constructed connection URL.

  Server selection and variable changes are now persisted to the workspace store via new `asyncapi-server:update:selected` and `asyncapi-server:update:variables` events and their mutators, mirroring the OpenAPI wiring.

## 0.12.3

### Patch Changes

- [#9340](https://github.com/scalar/scalar/pull/9340): feat: add getChannelConnectionContext for AsyncAPI WebSocket channels

  Add channel connection context helpers that resolve channel, messages, parameters, servers, security, and connection URL for WebSocket client UI.

- [#9309](https://github.com/scalar/scalar/pull/9309): feat: add `modelsSectionLabel` configuration (`'Models' | 'Schemas' | string`) to use OpenAPI-style Schemas terminology in the sidebar, content, and search.
- [#7618](https://github.com/scalar/scalar/pull/7618): feat(api-reference): add `setPageTitle` to customize the browser tab title

  Pass a `setPageTitle` function to control the browser tab title. It is called whenever the section in view changes — on sidebar clicks, on scroll, and when switching documents — and receives the section title and the active OpenAPI document:

  ```js
  setPageTitle: ({ title, document }) => `${document.title} – ${title}`
  ```

## 0.12.2

### Patch Changes

- [#9313](https://github.com/scalar/scalar/pull/9313): feat: add AsyncAPI connection URL builder and server list helpers

## 0.12.1

### Patch Changes

- [#9311](https://github.com/scalar/scalar/pull/9311): feat: add typed AsyncAPI WebSocket binding schema
  - Add `asyncApiWsBindingObject` for `bindings.ws` with `method`, `query`, `headers`, and `bindingVersion`
  - Add `asyncApiSchemaObjectOrReference` (Schema Object | Reference Object) for WebSocket binding fields that exclude Multi Format Schema Object
  - Regenerate `@scalar/types/asyncapi/3.1` types

## 0.12.0

### Minor Changes

- [#9264](https://github.com/scalar/scalar/pull/9264): feat: add AsyncAPI 3.1 types and `@scalar/types/asyncapi/3.1` export
- [#9297](https://github.com/scalar/scalar/pull/9297): feat: add asyncapi extensions

### Patch Changes

- [#9169](https://github.com/scalar/scalar/pull/9169): feat: add `customFetch` to the api-reference configuration and forward it to the API client so requests (including "Test Request" calls) use the custom fetch — enabling things like `credentials: 'include'`. The previous `fetch` option is deprecated and migrated automatically with a console warning.
- [#9294](https://github.com/scalar/scalar/pull/9294): refactor: move the schemas to the schemas folder and generate the types from schemas
- [#9292](https://github.com/scalar/scalar/pull/9292): refactor: move extensions to the schema package

## 0.11.0

### Minor Changes

- [#9211](https://github.com/scalar/scalar/pull/9211): feat: write pure types without using the zod schemas

## 0.10.0

### Minor Changes

- [#8844](https://github.com/scalar/scalar/pull/8844): feat: write pure types without using the zod schemas

## 0.9.6

## 0.9.5

## 0.9.4

## 0.9.3

## 0.9.2

## 0.9.1

### Patch Changes

- [#8862](https://github.com/scalar/scalar/pull/8862): add `python/aiohttp` as a supported code snippet client and expose it through shared snippet client types and config schemas
- [#8810](https://github.com/scalar/scalar/pull/8810): refactor: move telemetry to an optional plugin

## 0.9.0

### Minor Changes

- [#8771](https://github.com/scalar/scalar/pull/8771): feat(snippetz): migrate R code snippets from httr to httr2

### Patch Changes

- [#8817](https://github.com/scalar/scalar/pull/8817): feat(snippetz): add a Laravel HTTP client plugin for PHP snippets

  Added a new `php/laravel` client generator in `@scalar/snippetz`, including comprehensive request coverage for headers, cookies, auth, query params, JSON, multipart, form-encoded, binary, and fallback bodies.

  Updated generated client registries and schema wiring so the new client is available across Scalar:
  - `@scalar/types` `GROUPED_CLIENTS` / `AVAILABLE_CLIENTS`
  - `@scalar/workspace-store` reference-config schema
  - generated docs and integration client enums

  Updated api-client expectations for the increased total built-in client count.

## 0.8.0

### Minor Changes

- [#8695](https://github.com/scalar/scalar/pull/8695): feat: suport pre/post request scripts

## 0.7.6

### Patch Changes

- [#8661](https://github.com/scalar/scalar/pull/8661): fix(api-client): support OAuth redirect callback override for Electron-friendly flows
- [#8664](https://github.com/scalar/scalar/pull/8664): refactor: replace wildcard export barrels with explicit named re-exports

## 0.7.5

### Patch Changes

- [#8574](https://github.com/scalar/scalar/pull/8574): feat: make external urls configurable

## 0.7.4

### Patch Changes

- [#8466](https://github.com/scalar/scalar/pull/8466): chore: new build pipeline

## 0.7.3

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.4.1**
  - [#8420](https://github.com/scalar/scalar/pull/8420): fix TypeScript access to navigator.userAgentData in isMacOS without ts-expect-error

## 0.7.2

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.4.0**
  - [#8336](https://github.com/scalar/scalar/pull/8336): feat: support flushing any pending operations

## 0.7.1

### Patch Changes

- [#8381](https://github.com/scalar/scalar/pull/8381): feat: add mcp config support

## 0.7.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.3.0**
  - [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 0.6.10

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.18**
  - [#8314](https://github.com/scalar/scalar/pull/8314): chore: limit concurrent operations while migrating workspaces

## 0.6.9

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.17**
  - [#8310](https://github.com/scalar/scalar/pull/8310): refactor: move helpers to the helpers package to share primitive helpers

## 0.6.8

### Patch Changes

- [#8274](https://github.com/scalar/scalar/pull/8274): feat(agent): add config to hide search api

## 0.6.7

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.16**
  - [#8248](https://github.com/scalar/scalar/pull/8248): fix: local storage migration script

## 0.6.6

### Patch Changes

- [#8212](https://github.com/scalar/scalar/pull/8212): chore: version bump

#### Updated Dependencies

- **@scalar/helpers@0.2.15**
  - [#8212](https://github.com/scalar/scalar/pull/8212): chore: version bump

## 0.6.5

### Patch Changes

- [#8207](https://github.com/scalar/scalar/pull/8207): chore: version bump

#### Updated Dependencies

- **@scalar/helpers@0.2.14**
  - [#8207](https://github.com/scalar/scalar/pull/8207): chore: version bump

## 0.6.4

### Patch Changes

- [#8174](https://github.com/scalar/scalar/pull/8174): feat: add `createAnySecurityScheme` config option to control generic auth scheme creation

#### Updated Dependencies

- **@scalar/helpers@0.2.13**
  - [#7826](https://github.com/scalar/scalar/pull/7826): feat: added migrator for v1 local storage to v2 indexdb

## 0.6.3

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.12**
  - [#8178](https://github.com/scalar/scalar/pull/8178): chore: package bump due to ci failure

## 0.6.2

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.11**
  - [#8016](https://github.com/scalar/scalar/pull/8016): feat: move history and auth into their own store

## 0.6.1

### Patch Changes

- [#8000](https://github.com/scalar/scalar/pull/8000): fix(agent): change enabled flag to disabled
- [#7995](https://github.com/scalar/scalar/pull/7995): feat: enable/disable agent scalar

#### Updated Dependencies

- **@scalar/helpers@0.2.10**
  - [#7963](https://github.com/scalar/scalar/pull/7963): feat: unify is-object helpers

## 0.6.0

### Minor Changes

- [#7959](https://github.com/scalar/scalar/pull/7959): feat(agent): add agent scalar to localhost

## 0.5.10

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.9**
  - [#7894](https://github.com/scalar/scalar/pull/7894): fix: the import and export of redirect to proxy

## 0.5.9

### Patch Changes

- [#7866](https://github.com/scalar/scalar/pull/7866): chore: expose har types

## 0.5.8

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.8**
  - [#7751](https://github.com/scalar/scalar/pull/7751): fix: auth persistence

## 0.5.7

### Patch Changes

#### Updated Dependencies

- **@scalar/helpers@0.2.7**
  - [#7720](https://github.com/scalar/scalar/pull/7720): feat: escape XML in json2xml

## 0.5.6

### Patch Changes

- [#7661](https://github.com/scalar/scalar/pull/7661): fix: all issues for client modal v2 preparation

#### Updated Dependencies

- **@scalar/helpers@0.2.6**
  - [#7661](https://github.com/scalar/scalar/pull/7661): fix: all issues for client modal v2 preparation

## 0.5.5

### Patch Changes

- [#7605](https://github.com/scalar/scalar/pull/7605): fix: all issues for client modal v2 preparation

#### Updated Dependencies

- **@scalar/helpers@0.2.5**
  - [#7605](https://github.com/scalar/scalar/pull/7605): fix: all issues for client modal v2 preparation

## 0.5.4

### Patch Changes

- [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

#### Updated Dependencies

- **@scalar/helpers@0.2.4**
  - [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job
  - [#7567](https://github.com/scalar/scalar/pull/7567): feat: add code samples to client v2

## 0.5.3

### Patch Changes

- [#7498](https://github.com/scalar/scalar/pull/7498) [`bb52d9a`](https://github.com/scalar/scalar/commit/bb52d9a21e53628270bab93c0f03b5731c9c97c6) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat: add `PostDataCommon` to `/snippetz` export`

## 0.5.2

### Patch Changes

- [#7506](https://github.com/scalar/scalar/pull/7506) [`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: use caret version for `zod`

## 0.5.1

### Patch Changes

- [#7387](https://github.com/scalar/scalar/pull/7387) [`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03) Thanks [@geoffgscott](https://github.com/geoffgscott)! - hotfix: patch exports from build tooling bug

## 0.5.0

### Minor Changes

- [#7373](https://github.com/scalar/scalar/pull/7373) [`cbedfab`](https://github.com/scalar/scalar/commit/cbedfab576502069be27ceacbea145a917214e47) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(types): legacy - remove unused types

- [#7373](https://github.com/scalar/scalar/pull/7373) [`cbedfab`](https://github.com/scalar/scalar/commit/cbedfab576502069be27ceacbea145a917214e47) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(types): removes `export *` from non-index exports

### Patch Changes

- [#7320](https://github.com/scalar/scalar/pull/7320) [`44aeef0`](https://github.com/scalar/scalar/commit/44aeef01073801165e339163462378b7b62ff68d) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: rename showToolbar to showDeveloperTools

## 0.4.0

### Minor Changes

- [#7129](https://github.com/scalar/scalar/pull/7129) [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Simplify ApiReferences state management and migrate to new shared sidebar component. Eliminates the useSidebar and useNav hooks in favour of event bubbling and centralized state management in ApiReference.vue

### Patch Changes

- [#7086](https://github.com/scalar/scalar/pull/7086) [`eb022f2`](https://github.com/scalar/scalar/commit/eb022f2c8f93c84a04c0093fefe8a1e05d6ec80d) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: new `content.end` slot for the plugin API

- [#7094](https://github.com/scalar/scalar/pull/7094) [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Migrate to workspace store as primary source of truth.

- Updated dependencies [[`2239843`](https://github.com/scalar/scalar/commit/2239843150ed16d1ca35b0b1f8e90cd3e35be7ce)]:
  - @scalar/openapi-types@0.5.1

## 0.3.2

### Patch Changes

- f3e17d8: fix(types): allow async callbacks for event handlers
- Updated dependencies [f69e7cc]
  - @scalar/openapi-types@0.5.0

## 0.3.1

### Patch Changes

- 1e01464: Adds a new ApiReferenceConfigWithSource type and make the base ApiReferenceConfig type agnostic of any document sources.
- Updated dependencies [15c4240]
  - @scalar/openapi-types@0.4.1

## 0.3.0

### Minor Changes

- 008a0f3: feat: migrate to Zod 4

### Patch Changes

- Updated dependencies [008a0f3]
  - @scalar/openapi-types@0.4.0

## 0.2.16

### Patch Changes

- 005fba9: feat: documentDownloadType: 'direct'

## 0.2.15

### Patch Changes

- abe3842: Add analytic events to api-client + add telemetry option

## 0.2.14

### Patch Changes

- 792c937: Configurable option for sidebar to show method path instead of method summary.

## 0.2.13

### Patch Changes

- 50032be: feat: added config options for sorting schema properties

## 0.2.12

### Patch Changes

- 6a88108: feat: add option to expandAllResponses and expandAllModelSections
  - @scalar/openapi-types@0.3.7

## 0.2.11

### Patch Changes

- ccf875a: feat: support x-scalar-credentials-location extension
- 94d6d0c: fix: remove old ssr state and update nuxt for workspace store
- Updated dependencies [ccf875a]
  - @scalar/openapi-types@0.3.7

## 0.2.10

### Patch Changes

- fb62e1b: feat: add externalDocs

## 0.2.9

### Patch Changes

- 591562f: feat: add support for x-scalar-security-body extension
- Updated dependencies [591562f]
  - @scalar/openapi-types@0.3.6

## 0.2.8

### Patch Changes

- c10e191: feat(oauth2): add support for x-tokenName extension

## 0.2.7

### Patch Changes

- ad2e3e6: feat: new onBeforeRequest hook to modify the request

## 0.2.6

### Patch Changes

- 2d7f995: refactor: use more common straight apostrophe ' instead of the real apostrophe ’
- Updated dependencies [2d7f995]
  - @scalar/openapi-types@0.3.5

## 0.2.5

### Patch Changes

- Updated dependencies [533469b]
  - @scalar/openapi-types@0.3.4

## 0.2.4

### Patch Changes

- 1468280: feat: allow fine gained download button file type control

## 0.2.3

### Patch Changes

- 221e35f: feat: added webhooks
- Updated dependencies [221e35f]
  - @scalar/openapi-types@0.3.3

## 0.2.2

### Patch Changes

- Updated dependencies [05c22c7]
  - @scalar/openapi-types@0.3.2

## 0.2.1

### Patch Changes

- 4440949: chore: bumping packages
- Updated dependencies [4440949]
  - @scalar/openapi-types@0.3.1

## 0.2.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

### Patch Changes

- Updated dependencies [483ca93]
  - @scalar/openapi-types@0.3.0

## 0.1.16

### Patch Changes

- be8a6ec: chore: remove unused HarRequestWithPath

## 0.1.15

### Patch Changes

- f711ab5: feat: add auth persistance to references
- 0222ad4: feat: render specification extensions with React
- cb9428c: Support additional query parameters for the OAuth authorization request (prompt, audience, anything), and handle OAuth authorization denials
- 67aa0f4: fix: render correct queries with form data
- Updated dependencies [cb9428c]
  - @scalar/openapi-types@0.2.3

## 0.1.14

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild
- Updated dependencies [8c7bad8]
  - @scalar/openapi-types@0.2.2

## 0.1.13

### Patch Changes

- e8457cb: Unify themes across scalar. Cleanup interface and remove CJS build.

## 0.1.12

### Patch Changes

- 62c4ce3: feat: SvelteKit API Reference integration
  - @scalar/openapi-types@0.2.1

## 0.1.11

### Patch Changes

- eb4854d: fix: types of authentication config

## 0.1.10

### Patch Changes

- Updated dependencies [fa8ed84]
  - @scalar/openapi-types@0.2.1

## 0.1.9

### Patch Changes

- 17e7d02: chore: export more types from the base types package for commonjs apps

## 0.1.8

### Patch Changes

- feaa314: feat(themes): add laserwave theme

## 0.1.7

### Patch Changes

- 9def02e: feat: added new callback for execution request
- 3745d77: feat: new plugin system

## 0.1.6

### Patch Changes

- 3783345: feat: add some callbacks to sidebar items

## 0.1.5

### Patch Changes

- e09dab3: feat: multiple configurations with multiple sources
- 04e27a1: feat: support x-default-scopes
- Updated dependencies [e62e677]
- Updated dependencies [82f16a5]
  - @scalar/openapi-types@0.2.0

## 0.1.4

### Patch Changes

- 8efedf3: fix: allow async functions in onDocumentSelect
- 82a4ba8: chore: move security schemes into types package for future reference
- 57feba6: feat: added new auth config (v2)

## 0.1.3

### Patch Changes

- 543a16c: feat: allow to explicitly set the default source
- 57e96a0: feat: add onDocumentSelect callback when switching multi configs

## 0.1.2

### Patch Changes

- 7a8965c: chore: remove spec prefix
- 49dffff: feat: expose the isLoading prop to control loading of references

## 0.1.1

### Patch Changes

- 39c0f47: chore: export multi doc types

## 0.1.0

### Minor Changes

- 5f9a8a2: feat!: remove the spec prefix, make content and url top-level attributes

## 0.0.41

### Patch Changes

- fc6a45e: refactor: use import aliases

## 0.0.40

### Patch Changes

- 4d03e0f: feat: multiple documents

## 0.0.39

### Patch Changes

- bab7990: refactor: move HtmlRenderingConfiguration type to types package
- 2c621d4: refactor: move snippetz types to @scalar/types

## 0.0.38

### Patch Changes

- 7f1a40e: fix: hiddenClients can be a boolean

## 0.0.37

### Patch Changes

- 89d8b75: feat: new ApiReferenceConfiguration type
- 8a04b8d: fix: adds vendor specific mime type support
  - @scalar/openapi-types@0.1.9

## 0.0.36

### Patch Changes

- 4db5161: feat: allow multiple tokens for bearer auth

## 0.0.35

### Patch Changes

- 946a5df: feat: add front-end redirect
- cf14cbb: fix: show _/_ mimetype in example response
- Updated dependencies [c10bbf5]
  - @scalar/openapi-types@0.1.9

## 0.0.34

### Patch Changes

- Updated dependencies [e350f23]
  - @scalar/openapi-types@0.1.8

## 0.0.33

### Patch Changes

- 54fdfcb: chore: remove spec wording
- fa6afe8: chore: code formatting
  - @scalar/openapi-types@0.1.7

## 0.0.32

### Patch Changes

- f500435: chore: stricter TypeScript configuration
- b5727ef: feat: allow pre-selecting multiple and complex auth
- 34e6f52: feat: upgrade to stricter tsconfig
- f2b082a: feat: add onLoaded event

## 0.0.31

### Patch Changes

- a30e7cc: fix: package doesn’t work with `moduleResolution: NodeNext`

## 0.0.30

### Patch Changes

- Updated dependencies [f9bf5f1]
  - @scalar/openapi-types@0.1.7

## 0.0.29

### Patch Changes

- be34e7d: feat: adds value to server variables schema

## 0.0.28

### Patch Changes

- 702c386: feat: add support for stability
- f1f39b0: feat: rewmove custom Server type

## 0.0.27

### Patch Changes

- b552db5: feat: add url customization functions for references

## 0.0.26

### Patch Changes

- 60cd6f1: feat: render the operation description from the new store
- 60cd6f1: chore: deprecated the TransformedOperation type
- Updated dependencies [13333e6]
  - @scalar/openapi-types@0.1.6

## 0.0.25

### Patch Changes

- c263aaf: chore: improve the comment for UnknownObject

## 0.0.24

### Patch Changes

- fbef0c3: chore: remove httpsnippet-lite

## 0.0.23

### Patch Changes

- c2f5f08: feat: adds hideClientButton option configuration

## 0.0.22

### Patch Changes

- baaad1c: refactor: deprecated the `proxy` configuration attribute, and use `proxyUrl` everywhere
- c984ac8: feat: adds servers to information reference config

## 0.0.21

### Patch Changes

- 9d23f95: chore: deprecate Parameters, use Parameter instead

## 0.0.20

### Patch Changes

- f67c3bc: feat: add framework themes

## 0.0.19

### Patch Changes

- Updated dependencies [a607115]
  - @scalar/openapi-types@0.1.5

## 0.0.18

### Patch Changes

- fb798c8: chore: make OpenAPI document URLs the default, deprecated `content`

## 0.0.17

### Patch Changes

- Updated dependencies [2b540b9]
  - @scalar/openapi-types@0.1.4

## 0.0.16

### Patch Changes

- dbbe38f: feat: add framework identifier for debugging purposes

## 0.0.15

### Patch Changes

- Updated dependencies [8759e7f]
  - @scalar/openapi-types@0.1.3

## 0.0.14

### Patch Changes

- e911047: Add default exports
- Updated dependencies [e911047]
  - @scalar/openapi-types@0.1.2

## 0.0.13

### Patch Changes

- 9dc2ab7: feat: new `operationsSorter` option

## 0.0.12

### Patch Changes

- 8f12149: chore: add point to declaration file

## 0.0.11

### Patch Changes

- f961940: feat: remove @scalar/themes from the dependencies of @scalar/types

## 0.0.10

### Patch Changes

- Updated dependencies [7beeef3]
  - @scalar/themes@0.9.31

## 0.0.9

### Patch Changes

- Updated dependencies [121bc7e]
  - @scalar/themes@0.9.30

## 0.0.8

### Patch Changes

- dc9aff2: chore: replace proprietary ScalarResponse with OpenAPI ResponseObject
- Updated dependencies [c577cde]
- Updated dependencies [dc9aff2]
  - @scalar/themes@0.9.29
  - @scalar/openapi-types@0.1.1

## 0.0.7

### Patch Changes

- a07cfc8: feat: allow to hide the Test Request button
- 023ca15: feat: adds favicon configuration
- 85872b6: feat: allow to hide search sidebar

## 0.0.6

### Patch Changes

- Updated dependencies [b4f9f97]
  - @scalar/openapi-types@0.1.0

## 0.0.5

### Patch Changes

- Updated dependencies [80a3c46]
  - @scalar/themes@0.9.28

## 0.0.4

### Patch Changes

- Updated dependencies [bb13304]
  - @scalar/themes@0.9.27

## 0.0.3

### Patch Changes

- Updated dependencies [abb8ddd]
  - @scalar/themes@0.9.26

## 0.0.2

### Patch Changes

- 910b1c2: Add build step for path resolution

## 0.0.1

### Patch Changes

- 78db8f5: feat: use new @scalar/types package
- Updated dependencies [78db8f5]
  - @scalar/themes@0.9.25

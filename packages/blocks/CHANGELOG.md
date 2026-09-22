# @scalar/blocks

## 0.2.0

### Minor Changes

- [#10178](https://github.com/scalar/scalar/pull/10178): Support OpenAPI 3.2 streaming item schemas in the workspace store, request body examples, and API reference schema views. Frame generated and structured examples as JSON Lines, JSON Sequence, or server-sent events while preserving explicit wire-format strings.

  Preserve generated falsy request examples (`0`, `false`, and empty strings) for non-streaming bodies as well.

  Use cURL `--data-binary` for supported streaming media types, making framed body handling explicit. Authored arrays and objects are framed as stream records; authored wire-format strings remain unchanged. SSE records with no valid fields are safely omitted with one console warning per serialization call reporting the omitted count, including when all records are omitted.

### Patch Changes

- [#10201](https://github.com/scalar/scalar/pull/10201): Support positional and nested multipart request encoding with prefixEncoding, itemEncoding, and nested encoding objects. Keep generated code snippets in sync with multipart request bodies.

  Reject ambiguous named positional items and multipart nesting beyond eight levels. Use a stable fallback root for XML parts.

  Document multipart content-type defaults and wildcard selection policies. Route structured XML parts through a shared adapter while retaining legacy root-name behavior.

  Regenerate multipart boundaries that collide with resolved text or nested delimiters, keeping binary payload bytes intact.

- [#10208](https://github.com/scalar/scalar/pull/10208): Share OpenAPI 3.2 example-value selection across request bodies, response examples, and code snippets. Preserve serialized payloads verbatim, serialize structured JSON strings correctly, retain falsy values, and replace original example sources after body edits. Keep dataValue and serializedValue during document ingestion.

  Editing a request body, including form fields, discards its authored `externalValue` URL and replaces it with the edited inline value in the workspace and exported API description. Rendering or focusing a form field preserves the external source.

  Form editors prefer structured `dataValue` when both example fields exist, while raw editors, requests, and code snippets preserve `serializedValue` as wire text. Structured examples now affect generated request payloads and snippets; XML remains raw-only in the request editor.

- [#10198](https://github.com/scalar/scalar/pull/10198): Support OpenAPI 3.2 cookie serialization with semicolon-separated entries and no percent-encoding in requests and code examples.

  Browser XHR and jQuery code examples now set explicit Cookie header values through `document.cookie` and enable credentialed requests, including when no structured HAR cookies are supplied. Run the cookie setup on the request origin. Requests without cookie-style parameters retain structured HAR cookies alongside explicit Cookie headers.

  Warn once per parameter name in the developer console when cookie-style parameters declare invalid `explode: false`, then use the expanded fallback consistently for requests and snippets. Browser cookie setup cannot assign cookies to an unrelated API domain; credentialed cross-origin responses require the appropriate CORS configuration and eligible stored cookies.

## 0.1.20

### Patch Changes

- [#10240](https://github.com/scalar/scalar/pull/10240): Load external examples on demand when their selected preview is visible or Test Request opens, instead of downloading every payload while loading the API description. Share and cache downloads, preserve relative URL origins, and show loading and retry states while preventing incomplete requests from being sent.

## 0.1.19

## 0.1.18

## 0.1.17

### Patch Changes

- [#9851](https://github.com/scalar/scalar/pull/9851): Serialize OpenAPI 3.2 `querystring` parameters when generating code snippets, so their values land in the request query string instead of being silently dropped.
- [#10140](https://github.com/scalar/scalar/pull/10140): Replace redundant type assertions with compiler-checked annotations, typed accumulators, and existing guards across helpers, API conversion, request handling, and schema rendering.

  Narrow DOM elements and caught errors before accessing their properties. Correct header lookup to include missing values and handle them during PowerShell snippet generation.

  Validate release-note provider responses, represent unresolved references and absent groups in helper return types, and require narrowing merged object values. Preserve AsyncAPI broker credentials separately from HTTP authentication schemes.

- [#10142](https://github.com/scalar/scalar/pull/10142): Send multipart array properties as separate parts with the same field name, applying encoding to each item. Preserve JSON item content types, uploaded files, and array values after form edits, and generate matching code snippets.

  Send JSON form fields without an upload filename and preserve fields and files in request history.

  Rename the RestSharp snippet's internal `getMethod` helper so it no longer clashes with the `getMethod` that Nitro bundles into server builds (the new multipart imports shifted chunking and surfaced the collision).

## 0.1.16

## 0.1.15

## 0.1.14

### Patch Changes

- [#9941](https://github.com/scalar/scalar/pull/9941): Republish every package through npm trusted publishing. No functional changes.

## 0.1.13

### Patch Changes

- [#9872](https://github.com/scalar/scalar/pull/9872): Bump shared runtime dependencies: `js-base64` (`^3.7.8` -> `^3.9.2`) and `type-fest` (`^5.3.1` -> `^5.8.0`).

## 0.1.12

## 0.1.11

## 0.1.10

## 0.1.9

### Patch Changes

- [#9752](https://github.com/scalar/scalar/pull/9752): fix: stop vendoring a second copy of the themes reset in the standalone stylesheet

  The blocks `style.css` build pulled in `@scalar/components/style.css`, which re-imports `@scalar/themes/style.css` — so the published stylesheet shipped two unlayered copies of the universal reset. Loaded after the other Scalar packages, the late duplicate clobbered component font sizes, padding, and colors. Blocks now composes the lean `@scalar/components/vue-styles.css` instead, matching how `@scalar/api-reference` and `@scalar/components` build their stylesheets, and exposes `./vue-styles.css` alongside `./style.css` and `./tailwind.config.css`.

- [#9689](https://github.com/scalar/scalar/pull/9689): fix: multipart/form-data array-of-objects fields now serialize as a JSON array instead of a single object in generated request examples

## 0.1.8

### Patch Changes

- [#9719](https://github.com/scalar/scalar/pull/9719): docs: update the Scalar platform overview block in the README

## 0.1.7

## 0.1.6

## 0.1.5

## 0.1.4

## 0.1.3

## 0.1.2

## 0.1.1

### Patch Changes

- [#9610](https://github.com/scalar/scalar/pull/9610): Only show required parameters in code examples. Optional query, header, and cookie parameters are now omitted from the generated request snippets unless they are explicitly enabled via the `x-disabled: false` extension.

## 0.1.0

### Minor Changes

- [#8519](https://github.com/scalar/scalar/pull/8519): refactor: extract the code example block into `@scalar/blocks/code-example`. `api-client`, `api-client-react`, and `api-reference` now import `CodeExample`, `findClient`, `generateClientOptions`, and the related helpers from the new package. `workspace-store` exports `isParamDisabled` with an optional `defaultDisabled` argument.

  **Breaking (`@scalar/api-client`):** the `@scalar/api-client/blocks/operation-code-sample` and `@scalar/api-client/v2/blocks/operation-code-sample` export paths have been removed. Import from `@scalar/blocks/code-example` instead, and use the renamed `CodeExample` / `CodeExampleProps` (previously `OperationCodeSample` / `OperationCodeSampleProps`).

# scalar-fastapi

## 1.9.0

### Minor Changes

- [#10030](https://github.com/scalar/scalar/pull/10030): feat(fastapi): accept plain strings for enum options

  `layout`, `theme`, `search_hot_key`, and `document_download_type` now accept a plain string (for example `theme="moon"`) in addition to their enum members, so every option can be configured the same way. The enums are still exported and keep working unchanged. `force_dark_mode_state` is also tightened from `str` to `Literal["dark", "light"]`.

- [#10028](https://github.com/scalar/scalar/pull/10028): feat(fastapi): add one-line `add_scalar_reference(app)` setup and fix small bugs

  `add_scalar_reference(app)` registers the reference route for you and reads `title` and `openapi_url` straight from the FastAPI app, so the common case is a single line. Any `get_scalar_api_reference` option (theme, custom `route`, etc.) can still be passed through.

  Also fixes a few papercuts in `get_scalar_api_reference`: the page title is now HTML-escaped, a document containing `</script>` can no longer break out of the inline script, the `dark_mode` type hint matches its `None` default, and the mutable default arguments were replaced with `None`.

### Patch Changes

- [#10027](https://github.com/scalar/scalar/pull/10027): chore(fastapi): move to pyproject.toml and declare dependencies

  Replaces the legacy `setup.py`/`setup.cfg` with a modern `pyproject.toml` (hatchling). The package now declares its runtime dependencies (`fastapi`, `pydantic`, `typing_extensions`), a supported Python version (`>=3.9`), and richer PyPI metadata (project URLs and classifiers). The version stays in sync with the monorepo through the existing Changesets flow.

- [#10031](https://github.com/scalar/scalar/pull/10031): fix(fastapi): stop the default theme from hiding an introduction card

  The bundled default theme included `.scalar-card:nth-of-type(3) { display: none }`, which hid whichever introduction card (server, authentication, client, …) happened to render third. Because that depends on the document and the Scalar version, it hid content unpredictably. The rule has been removed so all cards render.

## 1.8.2

### Patch Changes

- [#8764](https://github.com/scalar/scalar/pull/8764): fix(fastapi): include MIT license metadata in PyPI package metadata

## 1.8.1

### Patch Changes

- [#8460](https://github.com/scalar/scalar/pull/8460): add support for `order_schema_properties_by` to pass through Scalar's `orderSchemaPropertiesBy` option (`"alpha"` or `"preserve"`)

## 1.8.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 1.7.0

### Minor Changes

- [#8304](https://github.com/scalar/scalar/pull/8304): fix: servers had the wrong structure documented, we adhere to the OpenAPI specification now

## 1.6.2

### Patch Changes

- [#8101](https://github.com/scalar/scalar/pull/8101): feat: agent scalar configuration
- [#8101](https://github.com/scalar/scalar/pull/8101): feat: export OpenAPISource and DocumentDownloadType

## 1.6.1

### Patch Changes

- [#7810](https://github.com/scalar/scalar/pull/7810): docs: update documentation domain

## 1.6.0

### Minor Changes

- [#7619](https://github.com/scalar/scalar/pull/7619): - Added `show_developer_tools` option to configure when the top developer tools panel is displayed (accepts "always", "localhost", or "never").
  - Added `telemetry` option to enable or disable telemetry.
  - Added `overrides` option to pass custom configuration directly to the Scalar.createApiReference config object.
  - Updated docs

## 1.5.0

### Minor Changes

- [#7401](https://github.com/scalar/scalar/pull/7401) [`dee0dcc`](https://github.com/scalar/scalar/commit/dee0dccf8f4b05b7bbf7e329a38e7ee24b67db81) Thanks [@horpto](https://github.com/horpto)! - fix(fastapi): fix PydanticDeprecatedSince20 for Config class field

## 1.4.4

### Patch Changes

- [#7332](https://github.com/scalar/scalar/pull/7332) [`93a466e`](https://github.com/scalar/scalar/commit/93a466e79b8a9f0475f36fe7b4254f4bbeaea616) Thanks [@hanspagel](https://github.com/hanspagel)! - feat: use support@scalar.com as the email address

## 1.4.3

### Patch Changes

- 186b1ea: not include tests package in wheel and tgz

## 1.4.2

### Patch Changes

- 24d5f59: fix: output for dark_mode is wrong

## 1.4.1

### Patch Changes

- da4d1da: fix: scalar-fastapi installs tests

## 1.4.0

### Minor Changes

- 961abc8: feat: cover more configuration options

### Patch Changes

- 6657e7c: fix: title is required
- 1c411d4: Export objects from scalar_fastapi package root
- 3473e08: fix: performance issues on script load

## 1.3.0

### Minor Changes

- 77af6e7: feat: use new HTML/JS API

### Patch Changes

- 6e22556: Add type marker according to PEP-561

## 1.2.3

### Patch Changes

- 15a3c87: chore(deps): update dependency starlette to v0.47.2 [security]

## 1.2.2

### Patch Changes

- 926de55: feat: add theme option

## 1.2.1

### Patch Changes

- 5266958: chore: trigger release

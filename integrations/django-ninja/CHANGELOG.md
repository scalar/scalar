# scalar-ninja

## 0.5.0

### Minor Changes

- [#11137](https://github.com/scalar/scalar/pull/11137): Add an opt-in ASP.NET Core form naming mode through the API Reference configuration option `multipartNaming: "indexed-dot"`. The body editor, sent requests, and code samples use indexed dotted names such as `Certificates[0].name` for nested fields in multipart and URL-encoded request bodies.

## 0.4.1

### Patch Changes

- [#11143](https://github.com/scalar/scalar/pull/11143): Expose the `showBadgesInSidebar` option in Java, FastAPI, Django Ninja, and .NET integrations so applications can enable sidebar badges. Badges remain hidden by default.

## 0.4.0

### Minor Changes

- [#11036](https://github.com/scalar/scalar/pull/11036): Expose `showDefaultClientsWithSdkInstallation` through the Python, Java, and .NET integrations to show built-in HTTP clients alongside SDK installation tabs.
- [#11033](https://github.com/scalar/scalar/pull/11033): Expose the selected code sample client persistence option in .NET, Java, FastAPI, and Django Ninja. Disable it to avoid reading or writing the selected-client local storage key while keeping page-local selection available.

## 0.3.3

### Patch Changes

- [#10994](https://github.com/scalar/scalar/pull/10994): Publish a new patch release through PyPI trusted publishing to recover from the previous failed uploads.

## 0.3.2

### Patch Changes

- [#10934](https://github.com/scalar/scalar/pull/10934): Keep embedded API descriptions inside the API reference configuration script and escape the Django Ninja page title.

## 0.3.1

### Patch Changes

- [#10339](https://github.com/scalar/scalar/pull/10339): Escape JavaScript and favicon URL attributes to prevent values from injecting HTML.

  Apply the same attribute escaping to Django Ninja JavaScript and favicon URLs.

## 0.3.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 0.2.0

### Minor Changes

- [#8304](https://github.com/scalar/scalar/pull/8304): fix: servers had the wrong structure documented, we adhere to the OpenAPI specification now

## 0.1.2

### Patch Changes

- [#8105](https://github.com/scalar/scalar/pull/8105): feat: agent scalar configuration

## 0.1.1

### Patch Changes

- [#7810](https://github.com/scalar/scalar/pull/7810): docs: update documentation domain

## 0.1.0

### Minor Changes

- [#7628](https://github.com/scalar/scalar/pull/7628): release

## 0.0.0

### Minor Changes

- [#7164](https://github.com/scalar/scalar/pull/7164) [`85717a8`](https://github.com/scalar/scalar/commit/85717a8b178f2f372e7501c931d1c2310e67097b) Thanks [@TheVaan](https://github.com/TheVaan)! - Refactored django-ninja integration

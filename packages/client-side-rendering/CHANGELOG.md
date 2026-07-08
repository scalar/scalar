# @scalar/client-side-rendering

## 0.3.2

## 0.3.1

## 0.3.0

### Minor Changes

- [#9588](https://github.com/scalar/scalar/pull/9588): Fix function-valued configuration options (like `onBeforeRequest` and the request hooks) being dropped in the Docusaurus integration. Docusaurus JSON-serializes route props, which silently strips functions, so the config is now serialized to JavaScript in the plugin and injected as a script. Exposes a reusable `serializeConfigToJs` helper from `@scalar/client-side-rendering`.

## 0.2.6

## 0.2.5

## 0.2.4

## 0.2.3

## 0.2.2

## 0.2.1

## 0.2.0

### Minor Changes

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

## 0.1.13

### Patch Changes

- [#9326](https://github.com/scalar/scalar/pull/9326): Export `DEFAULT_CDN` so consumers (e.g. `@scalar/astro`) can share the canonical fallback URL instead of duplicating it. Also widens `getConfiguration` to accept `Partial<HtmlRenderingConfiguration>`, removing the need for a `Record<string, unknown>` cast at the boundary.

## 0.1.12

## 0.1.11

## 0.1.10

## 0.1.9

### Patch Changes

- [#9211](https://github.com/scalar/scalar/pull/9211): chore: use the new schemas from the new package

## 0.1.8

### Patch Changes

- [#8844](https://github.com/scalar/scalar/pull/8844): chore: use the new schemas from the new package

## 0.1.7

## 0.1.6

## 0.1.5

## 0.1.4

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- [#8431](https://github.com/scalar/scalar/pull/8431): feat: init :)

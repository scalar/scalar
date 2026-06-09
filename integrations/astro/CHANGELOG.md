# @scalar/astro

## 0.4.2

## 0.4.1

## 0.4.0

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

## 0.3.0

### Minor Changes

- [#9326](https://github.com/scalar/scalar/pull/9326): Add a `renderMode="client"` option to `<ScalarComponent />` that mounts Scalar in the browser and re-mounts around Astro view-transition events. This fixes the API reference appearing only after a refresh on Starlight pages and other Astro sites that use client-side navigation.

### Patch Changes

- [#9326](https://github.com/scalar/scalar/pull/9326): Bring `renderMode="client"` to parity with `renderMode="static"`:
  - Normalize the configuration through `getConfiguration` so `url` takes precedence over `content` (and `content` functions are executed) before serialization, matching the static mode.
  - Load each `data-cdn` URL even when `window.Scalar` is already defined, so references with different CDN URLs no longer silently share the first-loaded bundle.

- [#9326](https://github.com/scalar/scalar/pull/9326): Move the `renderMode="client"` markup and bundled `<script>` into a dedicated `ScalarClient.astro` child component, so static-mode pages no longer pull in the client mount code or register view-transition listeners they do not need.

## 0.2.19

## 0.2.18

## 0.2.17

## 0.2.16

## 0.2.15

## 0.2.14

## 0.2.13

## 0.2.12

## 0.2.11

## 0.2.10

## 0.2.9

### Patch Changes

- [#8873](https://github.com/scalar/scalar/pull/8873): refactor: migrate integrations to client-side rendering package

## 0.2.8

## 0.2.7

## 0.2.6

## 0.2.5

## 0.2.4

## 0.2.3

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.4.3**

## 0.2.2

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.4.2**

## 0.2.1

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.4.1**

## 0.2.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.4.0**
  - [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 0.1.24

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.45**

## 0.1.23

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.44**

## 0.1.22

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.43**

## 0.1.21

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.42**

## 0.1.20

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.41**

## 0.1.19

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.40**

## 0.1.18

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.39**

## 0.1.17

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.38**

## 0.1.16

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.37**

## 0.1.15

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.36**

## 0.1.14

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.35**

## 0.1.13

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.34**

## 0.1.12

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.33**

## 0.1.11

### Patch Changes

- [#7810](https://github.com/scalar/scalar/pull/7810): docs: update documentation domain

## 0.1.10

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.32**

## 0.1.9

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.31**

## 0.1.8

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.30**

## 0.1.7

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.29**

## 0.1.6

### Patch Changes

#### Updated Dependencies

- **@scalar/core@0.3.28**

## 0.1.5

### Patch Changes

- Updated dependencies []:
  - @scalar/core@0.3.27

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @scalar/core@0.3.26

## 0.1.3

### Patch Changes

- Updated dependencies [[`daa5df4`](https://github.com/scalar/scalar/commit/daa5df45386fa2305275fbf0a7bbcede6bcf9edc)]:
  - @scalar/core@0.3.25

## 0.1.2

### Patch Changes

- Updated dependencies []:
  - @scalar/core@0.3.24

## 0.1.1

### Patch Changes

- Updated dependencies []:
  - @scalar/core@0.3.23

## 0.1.0

### Minor Changes

- [#7283](https://github.com/scalar/scalar/pull/7283) [`db087e0`](https://github.com/scalar/scalar/commit/db087e0b5ab43a7c6b419e37ccab39755d910560) Thanks [@hanspagel](https://github.com/hanspagel)! - hello astro :)

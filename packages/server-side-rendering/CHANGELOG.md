# @scalar/server-side-rendering

## 0.1.4

### Patch Changes

- [#8919](https://github.com/scalar/scalar/pull/8919): fix build externals so Node built-ins remain runtime imports in the SSR bundle

## 0.1.3

### Patch Changes

- [#8875](https://github.com/scalar/scalar/pull/8875): Preserve top-level function config values in SSR hydration output and throw when nested functions cannot be serialized safely.
- [#8875](https://github.com/scalar/scalar/pull/8875): fix(server-side-rendering): escape dynamic hydration property keys
- [#8859](https://github.com/scalar/scalar/pull/8859): refactor api-reference exports and enforce strict Vite entrypoint resolution from package exports

## 0.1.2

### Patch Changes

- [#8836](https://github.com/scalar/scalar/pull/8836): fix(server-side-rendering): harden inline script serialization against injection

## 0.1.1

## 0.1.0

### Minor Changes

- [#8431](https://github.com/scalar/scalar/pull/8431): feat: init :)

### Patch Changes

- [#8758](https://github.com/scalar/scalar/pull/8758): feat: default to dark-mode for non-js users
- [#8758](https://github.com/scalar/scalar/pull/8758): fix(server-side-rendering): respect dark mode config for initial body class

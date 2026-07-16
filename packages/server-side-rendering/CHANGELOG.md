# @scalar/server-side-rendering

## 0.1.35

## 0.1.34

## 0.1.33

## 0.1.32

## 0.1.31

## 0.1.30

## 0.1.29

## 0.1.28

## 0.1.27

### Patch Changes

- [#9555](https://github.com/scalar/scalar/pull/9555): Serialize the hydration config compactly instead of pretty-printed. This shrinks the inline hydration script in every server-rendered page and speeds up serialization for large configs.
- [#9556](https://github.com/scalar/scalar/pull/9556): Speed up the per-render check that rejects nested functions in the config. The common case (no functions) now skips building path strings for every node, while the precise error message is still produced when a nested function is found.

## 0.1.26

## 0.1.25

## 0.1.24

## 0.1.23

## 0.1.22

## 0.1.21

## 0.1.20

## 0.1.19

## 0.1.18

### Patch Changes

- [#9274](https://github.com/scalar/scalar/pull/9274): fix(server-side-rendering): update build script to correct import path

## 0.1.17

## 0.1.16

## 0.1.15

### Patch Changes

- [#9211](https://github.com/scalar/scalar/pull/9211): Integrate Unhead server-side head rendering in SSR output so `metaData` and title tags are included in the server-rendered HTML document.

## 0.1.14

### Patch Changes

- [#8967](https://github.com/scalar/scalar/pull/8967): Integrate Unhead server-side head rendering in SSR output so `metaData` and title tags are included in the server-rendered HTML document.

## 0.1.13

## 0.1.12

## 0.1.11

## 0.1.10

## 0.1.9

## 0.1.8

## 0.1.7

## 0.1.6

## 0.1.5

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

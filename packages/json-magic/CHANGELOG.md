# @scalar/json-magic

## 0.7.0

### Minor Changes

- [#7185](https://github.com/scalar/scalar/pull/7185) [`6ca835e`](https://github.com/scalar/scalar/commit/6ca835e5afd3e8c603e073e7c83f2cdd961a0f69) Thanks [@DemonHa](https://github.com/DemonHa)! - feat: add support for watch mode

### Patch Changes

- [#7213](https://github.com/scalar/scalar/pull/7213) [`43bc5e8`](https://github.com/scalar/scalar/commit/43bc5e8b90dc0edf7176d0ddfc64bf3212494458) Thanks [@DemonHa](https://github.com/DemonHa)! - fix: proxy performance issue because of multiple proxies

- Updated dependencies [[`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a)]:
  - @scalar/helpers@0.0.13

## 0.6.1

### Patch Changes

- 2089748: chore: add logs when fetching unsupported formats
- 8a7fb2a: fix: schema properties starting with an underscore are hidden
- Updated dependencies [3f6d0b9]
  - @scalar/helpers@0.0.12

## 0.6.0

### Minor Changes

- 4951456: feat: merge yaml aliases for in-mem representation

## 0.5.2

### Patch Changes

- 6462733: fix: comment out flaky test for now

## 0.5.1

### Patch Changes

- 41d8600: feat: add local ref bundling to bundler

## 0.5.0

### Minor Changes

- fe46413: feat: support for $id and $anchor

### Patch Changes

- dcf50ef: refactor: move escapeJsonPointer to @scalar/json-magic

## 0.4.3

### Patch Changes

- Updated dependencies [bff46e5]
  - @scalar/helpers@0.0.11

## 0.4.2

### Patch Changes

- 3bd1209: fix: do not throw when we set on an invalid ref
- 1943b99: chore: emit warning when trying to set an invalid ref

## 0.4.1

### Patch Changes

- Updated dependencies [821717b]
  - @scalar/helpers@0.0.10

## 0.4.0

### Minor Changes

- 99894bc: feat: correctly validate the schemas

### Patch Changes

- 06a46f0: fix: add proxy cache to fix reactivity issues
- 63283aa: fix: use hidden properties during validation
- Updated dependencies [98c55d0]
- Updated dependencies [0e747c7]
  - @scalar/helpers@0.0.9

## 0.3.1

### Patch Changes

- 88385b1: fix: external ref linking when starting with a /

## 0.3.0

### Minor Changes

- b93e1fe: feat(workspace-store): support relative external references
- c4bf497: fix(workspace-store): correctly propagate documents from one state to the other
- d8adbed: feat(workspace-store): resolve multi level refs
- 0c80ef0: feat(json-magic): change the way we resolve refs

### Patch Changes

- 0fcd446: feat(workspace-store): performance improvements
- Updated dependencies [66b18fc]
  - @scalar/helpers@0.0.8

## 0.2.0

### Minor Changes

- 0afc40c: feat(json-magic): introduce type-safe apply function with tracked target type in diff results
- 128af48: feat(workspace-store, json-magic): support `externalValue` fields on example object

## 0.1.0

### Minor Changes

- 952bde2: feat(json-magic): move json tooling to the new package

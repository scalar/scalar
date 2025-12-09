# @scalar/json-magic

## 0.8.5

### Patch Changes

- [#7506](https://github.com/scalar/scalar/pull/7506) [`72cd82f`](https://github.com/scalar/scalar/commit/72cd82fb8df63a9e5d0db1202978aebfefd0457a) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: use caret version for `yaml`

- Updated dependencies [[`21aa62e`](https://github.com/scalar/scalar/commit/21aa62e2ebdd262cb5aa53658c3b659736660722)]:
  - @scalar/helpers@0.2.1

## 0.8.4

### Patch Changes

- Updated dependencies [[`9ec8adf`](https://github.com/scalar/scalar/commit/9ec8adfea017333dee5bc3949104232f7dc57f4a)]:
  - @scalar/helpers@0.2.0

## 0.8.3

### Patch Changes

- [#7417](https://github.com/scalar/scalar/pull/7417) [`e04879c`](https://github.com/scalar/scalar/commit/e04879c65602dfb65393876754f5344751b8953d) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(json-margic): remove `helpers/generate-hash` invalid entrypoint

- [#7387](https://github.com/scalar/scalar/pull/7387) [`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03) Thanks [@geoffgscott](https://github.com/geoffgscott)! - hotfix: patch exports from build tooling bug

- [#7422](https://github.com/scalar/scalar/pull/7422) [`af54a80`](https://github.com/scalar/scalar/commit/af54a80349269a4269a68f6a372f837177a3537c) Thanks [@inyourtime](https://github.com/inyourtime)! - build(json-magic): prevent src folder from being published

- Updated dependencies [[`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03), [`86f028d`](https://github.com/scalar/scalar/commit/86f028deb0b456f923edd261f5f4b0fa9b616b7d)]:
  - @scalar/helpers@0.1.3

## 0.8.2

### Patch Changes

- [#7392](https://github.com/scalar/scalar/pull/7392) [`d86f1d6`](https://github.com/scalar/scalar/commit/d86f1d6911ecbca70b011a2a0efb6d6e0eca59bb) Thanks [@amritk](https://github.com/amritk)! - fix: move away from wasm hashing algo

- Updated dependencies [[`d86f1d6`](https://github.com/scalar/scalar/commit/d86f1d6911ecbca70b011a2a0efb6d6e0eca59bb), [`cded2d6`](https://github.com/scalar/scalar/commit/cded2d6c087418c3c44731d344d0827a87b78b74)]:
  - @scalar/helpers@0.1.2

## 0.8.1

### Patch Changes

- Updated dependencies [[`9c9dbba`](https://github.com/scalar/scalar/commit/9c9dbbaa940667303f0ace59469fd78c2a741937), [`4bec1ba`](https://github.com/scalar/scalar/commit/4bec1ba332e919c4ee32dcfbfb07bd8ee42c4d74)]:
  - @scalar/helpers@0.1.1

## 0.8.0

### Minor Changes

- [#7235](https://github.com/scalar/scalar/pull/7235) [`c1ecd0c`](https://github.com/scalar/scalar/commit/c1ecd0c6096f3fbe2e3d8ad3794ea718bb6bce66) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(json-magic): use `@scalar/helpers/node/path` polyfill

### Patch Changes

- [#7266](https://github.com/scalar/scalar/pull/7266) [`fddf294`](https://github.com/scalar/scalar/commit/fddf294b00dd8c9eb5c713c338f2ec6e3f62523d) Thanks [@amritk](https://github.com/amritk)! - fix: remove useage of crypto.subtle in all contexts

- Updated dependencies [[`fddf294`](https://github.com/scalar/scalar/commit/fddf294b00dd8c9eb5c713c338f2ec6e3f62523d), [`c1ecd0c`](https://github.com/scalar/scalar/commit/c1ecd0c6096f3fbe2e3d8ad3794ea718bb6bce66)]:
  - @scalar/helpers@0.1.0

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

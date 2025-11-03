# @scalar/sidebar

## 0.2.0

### Minor Changes

- [#7129](https://github.com/scalar/scalar/pull/7129) [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Simplify ApiReferences state management and migrate to new shared sidebar component. Eliminates the useSidebar and useNav hooks in favour of event bubbling and centralized state management in ApiReference.vue

- [#7199](https://github.com/scalar/scalar/pull/7199) [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat: update vue to 3.5.21

### Patch Changes

- [#7154](https://github.com/scalar/scalar/pull/7154) [`348f8f6`](https://github.com/scalar/scalar/commit/348f8f6292ef41844fda1fdd3089a55d97adbc0e) Thanks [@bgrcs](https://github.com/bgrcs)! - export sidebar components

- [#7159](https://github.com/scalar/scalar/pull/7159) [`c22fc4e`](https://github.com/scalar/scalar/commit/c22fc4e5acb49d648014a6100c724a5b33c59cde) Thanks [@amritk](https://github.com/amritk)! - feat: added new layouts for client v2

- [#7186](https://github.com/scalar/scalar/pull/7186) [`c162bb6`](https://github.com/scalar/scalar/commit/c162bb64b86e698427c1fce36f6d8a2b789e094a) Thanks [@amritk](https://github.com/amritk)! - feat: hooking up event bus to the store

- [#7227](https://github.com/scalar/scalar/pull/7227) [`704fa30`](https://github.com/scalar/scalar/commit/704fa302b2cdbb17b19ca2d742537ca163d58c1c) Thanks [@hwkr](https://github.com/hwkr)! - feat(sidebar): cleanup structure and improve text wrapping

- [#7209](https://github.com/scalar/scalar/pull/7209) [`a26ced6`](https://github.com/scalar/scalar/commit/a26ced6f2897074f0c102d5ccbff55c6fd520e12) Thanks [@hwkr](https://github.com/hwkr)! - fix(sidebar): word break sidebar entries with no spaces

- [#7200](https://github.com/scalar/scalar/pull/7200) [`5db92db`](https://github.com/scalar/scalar/commit/5db92db78e5b11bb052307bc10c1be4eb7a3f164) Thanks [@hwkr](https://github.com/hwkr)! - fix(api-reference): remove extra padding in sidebar

- [#7152](https://github.com/scalar/scalar/pull/7152) [`592533f`](https://github.com/scalar/scalar/commit/592533faf60b6a5ba27909a4ca0847ca9f04a96d) Thanks [@hwkr](https://github.com/hwkr)! - refactor(sidebar): remove some divs from sidebar elements

- Updated dependencies [[`913607c`](https://github.com/scalar/scalar/commit/913607c7d67236f08f5369408f304440c6c42b22), [`348f8f6`](https://github.com/scalar/scalar/commit/348f8f6292ef41844fda1fdd3089a55d97adbc0e), [`17817ad`](https://github.com/scalar/scalar/commit/17817addbca916c8d625a03335ae58be3a1c4e4b), [`c22fc4e`](https://github.com/scalar/scalar/commit/c22fc4e5acb49d648014a6100c724a5b33c59cde), [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a), [`c162bb6`](https://github.com/scalar/scalar/commit/c162bb64b86e698427c1fce36f6d8a2b789e094a), [`b64265b`](https://github.com/scalar/scalar/commit/b64265b3e8b447a4d1c6dafaca8135ef69545d98), [`6ca835e`](https://github.com/scalar/scalar/commit/6ca835e5afd3e8c603e073e7c83f2cdd961a0f69), [`6aa06b0`](https://github.com/scalar/scalar/commit/6aa06b0f843ae3d8e6771e3c02ac11ee0043a4b1), [`81b0a7a`](https://github.com/scalar/scalar/commit/81b0a7a4245619f03161eae639dc5834b77432b6), [`8a5a6a0`](https://github.com/scalar/scalar/commit/8a5a6a052cc05b0902b05052c80cc429ebc5a730), [`6ec8c29`](https://github.com/scalar/scalar/commit/6ec8c299d912111b029e8058979d00968b70691a), [`704fa30`](https://github.com/scalar/scalar/commit/704fa302b2cdbb17b19ca2d742537ca163d58c1c), [`a26ced6`](https://github.com/scalar/scalar/commit/a26ced6f2897074f0c102d5ccbff55c6fd520e12), [`33edbf2`](https://github.com/scalar/scalar/commit/33edbf2a2648eb72ae49e36dfd289d4d57dc18e0), [`6a090a2`](https://github.com/scalar/scalar/commit/6a090a2e07ef961c56041c85ee9786180437593a), [`4fe1643`](https://github.com/scalar/scalar/commit/4fe1643be51f76a8ebdfd75f5675337b8d43418e), [`592533f`](https://github.com/scalar/scalar/commit/592533faf60b6a5ba27909a4ca0847ca9f04a96d), [`75ad74c`](https://github.com/scalar/scalar/commit/75ad74c0eee10103b966ce4707e4823d819456a8), [`eba18d0`](https://github.com/scalar/scalar/commit/eba18d06267a163a8f91396a66f817100ee59461), [`c72a2c5`](https://github.com/scalar/scalar/commit/c72a2c59eb80e1f5e216c687229ff90bea88f554), [`0d9c945`](https://github.com/scalar/scalar/commit/0d9c945a696ea8b826d86f7b48ec6de4d85e64f0), [`43bc5e8`](https://github.com/scalar/scalar/commit/43bc5e8b90dc0edf7176d0ddfc64bf3212494458)]:
  - @scalar/workspace-store@0.18.0
  - @scalar/components@0.16.0
  - @scalar/helpers@0.0.13
  - @scalar/draggable@0.3.0
  - @scalar/icons@0.5.0
  - @scalar/themes@0.13.23

## 0.1.1

### Patch Changes

- Updated dependencies [f8efecd]
- Updated dependencies [3f6d0b9]
- Updated dependencies [1335923]
- Updated dependencies [07397c8]
  - @scalar/components@0.15.1
  - @scalar/helpers@0.0.12
  - @scalar/workspace-store@0.17.1
  - @scalar/themes@0.13.22

## 0.1.0

### Minor Changes

- 63ff417: feat: sidebar package

### Patch Changes

- Updated dependencies [13dcd89]
- Updated dependencies [63ff417]
- Updated dependencies [5d99cad]
- Updated dependencies [a747da6]
- Updated dependencies [c69cb71]
- Updated dependencies [90d54b6]
  - @scalar/themes@0.13.21
  - @scalar/workspace-store@0.17.0
  - @scalar/components@0.15.0

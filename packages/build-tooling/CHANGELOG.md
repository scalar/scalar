# @scalar/build-tooling

## 0.4.1

### Patch Changes

- [#7655](https://github.com/scalar/scalar/pull/7655): fix(build-tooling): import fast glob as commonJS
- [#7657](https://github.com/scalar/scalar/pull/7657): fix(build-tooling): add scripts directory to package files

## 0.4.0

### Minor Changes

- [#7516](https://github.com/scalar/scalar/pull/7516) [`f5b0ed4`](https://github.com/scalar/scalar/commit/f5b0ed42906801362464d23a8dd16c9634be2060) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat: remove `rollup`

### Patch Changes

- [#7518](https://github.com/scalar/scalar/pull/7518) [`bd529a1`](https://github.com/scalar/scalar/commit/bd529a1ee2bf9f34756ab3df3f41aec3af93be65) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix: include only relevant files in published package

## 0.3.1

### Patch Changes

- [#7411](https://github.com/scalar/scalar/pull/7411) [`bc266eb`](https://github.com/scalar/scalar/commit/bc266ebb47f04c06316c59e264e9d5f1c79154ac) Thanks [@hanspagel](https://github.com/hanspagel)! - chore: replace glob with fast-glob

- [#7413](https://github.com/scalar/scalar/pull/7413) [`633b2f5`](https://github.com/scalar/scalar/commit/633b2f5ad7a8dbd97d0d6087530ffa476c2c72ad) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(build-tooling): correct `fast-glob` import

- [#7427](https://github.com/scalar/scalar/pull/7427) [`5a91d5d`](https://github.com/scalar/scalar/commit/5a91d5dd1f884d34b2fc3cff3c0751ced6d165c2) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(build-tooling): `scalar-format-check` does not work

- [#7387](https://github.com/scalar/scalar/pull/7387) [`bfd814a`](https://github.com/scalar/scalar/commit/bfd814a4219660face190041cc4845182b56ab03) Thanks [@geoffgscott](https://github.com/geoffgscott)! - hotfix: patch exports from build tooling bug

- [#7397](https://github.com/scalar/scalar/pull/7397) [`ec33023`](https://github.com/scalar/scalar/commit/ec33023f8995395dd7dce04e98c9f35053aa482e) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(build-tooling): addPackageFileExports - handle fs.stat error using try-catch

## 0.3.0

### Minor Changes

- [#7275](https://github.com/scalar/scalar/pull/7275) [`3fd8752`](https://github.com/scalar/scalar/commit/3fd87526e4baa11d5ef8cc1b09e07b89af5c3b20) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(build-tooling): export vite plugin from /vite

- [#7275](https://github.com/scalar/scalar/pull/7275) [`3fd8752`](https://github.com/scalar/scalar/commit/3fd87526e4baa11d5ef8cc1b09e07b89af5c3b20) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(build-tooling): remove deprecated exports
  - `alias` - now exported by `@scalar/build-tooling/vite`
  - `createViteBuildOptions` - now exported by `@scalar/build-tooling/vite`
  - `ViteWatchWorkspace` - now exported by `@scalar/build-tooling/vite`
  - `createRollupConfig` - now exported by `@scalar/build-tooling/rollup`

- [#7275](https://github.com/scalar/scalar/pull/7275) [`3fd8752`](https://github.com/scalar/scalar/commit/3fd87526e4baa11d5ef8cc1b09e07b89af5c3b20) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(build-tooling): remove `autoCSSInject`

- [#7275](https://github.com/scalar/scalar/pull/7275) [`3fd8752`](https://github.com/scalar/scalar/commit/3fd87526e4baa11d5ef8cc1b09e07b89af5c3b20) Thanks [@marcalexiei](https://github.com/marcalexiei)! - feat(build-tooling): move `alias` inside vite exports

### Patch Changes

- [#7275](https://github.com/scalar/scalar/pull/7275) [`3fd8752`](https://github.com/scalar/scalar/commit/3fd87526e4baa11d5ef8cc1b09e07b89af5c3b20) Thanks [@marcalexiei](https://github.com/marcalexiei)! - fix(build-tooling): remove `@rollup/plugin-swc` dependency

## 0.2.8

### Patch Changes

- [#7180](https://github.com/scalar/scalar/pull/7180) [`a796162`](https://github.com/scalar/scalar/commit/a79616220d5deb0117c2d6d191b465b36ba6ccd0) Thanks [@geoffgscott](https://github.com/geoffgscott)! - Add addtional export entry points for api-referenc. Patch types on build-tooling

## 0.2.7

### Patch Changes

- cef1034: Improve return types for vite options

## 0.2.6

### Patch Changes

- 1f52b45: Outputs the time it took to build types when running tsc/vue-tsc

## 0.2.5

### Patch Changes

- 4502b11: Move to .js bin scripts to avoid vite-node conflicts

## 0.2.4

### Patch Changes

- 2d7f995: refactor: use more common straight apostrophe ' instead of the real apostrophe ’

## 0.2.3

### Patch Changes

- 4156f1d: Expand workspace store integration

## 0.2.2

### Patch Changes

- 8165b3b: feat(helpers): added new helpers package

## 0.2.1

### Patch Changes

- 84719d0: fix: exclude test files from esbuild entry points

## 0.2.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

## 0.1.19

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild

## 0.1.18

### Patch Changes

- c7c061c: Added ESBuild configs

## 0.1.17

### Patch Changes

- 5cf4908: Remove file extension

## 0.1.16

### Patch Changes

- f48d65f: fix: update turbo cache key
- 3283fc6: Add cssFilename fallback for Vite6->Vite5 alignment

## 0.1.15

### Patch Changes

- c10bbf5: chore: code style

## 0.1.14

### Patch Changes

- e350f23: chore: code style

## 0.1.13

### Patch Changes

- fa6afe8: chore: code formatting
- 1223c1f: chore: code style

## 0.1.12

### Patch Changes

- a40999d: chore: added type safety rule noUncheckedIndexedAccess

## 0.1.11

### Patch Changes

- e911047: Add default exports

## 0.1.10

### Patch Changes

- 2a1b5f4: Prevent dist deletion in vite builds

## 0.1.9

### Patch Changes

- 7cb664a: feat: rollup removes dist folder by default

## 0.1.8

### Patch Changes

- 397faa4: Add property for workspace path to vite reload watcher

## 0.1.7

### Patch Changes

- 94e68ab: chore: upgrade typescript to 5.5

## 0.1.6

### Patch Changes

- e0fc110: chore: patch bump all package

## 0.1.5

### Patch Changes

- 689677a: fix: auto importing css backup
- 8494349: Migrate to highlightjs based syntax highlighting
- b38c7ed: Update build configs to a standardized format
- 6fbb57e: feat: release all the packages

## 0.1.4

### Patch Changes

- 45dc04b: fix: can’t release packages

## 0.1.3

### Patch Changes

- 05e2e27: chore: add provenance statement

## 0.1.2

### Patch Changes

- 22f2858: chore: ran syncpack to update packages

## 0.1.1

### Patch Changes

- 2488ddd: Add trailing space for package file saving

## 0.1.0

### Minor Changes

- 7fb8273: Migrate to @scalar/openapi-parser

## 0.0.4

### Patch Changes

- cecf074: Migrate to oas utils for basic spec operations

## 0.0.3

### Patch Changes

- 313997c: chore: align node versions to basis 18

## 0.0.2

### Patch Changes

- c254604: Add OAS utils package

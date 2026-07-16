# @scalar/ts-to-openapi

## 0.2.2

### Patch Changes

- [#9710](https://github.com/scalar/scalar/pull/9710): Republish so the updated README (with the Scalar platform overview) reaches npm. Also renames the README generator metadata in package.json from `readme` to `scalarReadme`: npm treats a `readme` field as the readme text itself, so affected packages were published with a literal `[object Object]` readme on the registry instead of README.md.

## 0.2.1

### Patch Changes

- [#8466](https://github.com/scalar/scalar/pull/8466): chore: new build pipeline

## 0.2.0

### Minor Changes

- [#8322](https://github.com/scalar/scalar/pull/8322): chore: bump required node version to >=22 (LTS)

## 0.1.2

### Patch Changes

- [#7581](https://github.com/scalar/scalar/pull/7581): fix: npm publish job

## 0.1.1

### Patch Changes

- [#7558](https://github.com/scalar/scalar/pull/7558): fix: exclude test files from `dist` folder

## 0.1.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

## 0.0.6

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild

## 0.0.5

### Patch Changes

- 54fdfcb: chore: remove spec wording
- fa6afe8: chore: code formatting

## 0.0.4

### Patch Changes

- a40999d: chore: added type safety rule noUncheckedIndexedAccess

## 0.0.3

### Patch Changes

- e911047: Add default exports

## 0.0.2

### Patch Changes

- ed0bd1e: chore: upgrade typescript to 5.6.2

## 0.0.1

### Patch Changes

- 89adf75: feat(ts-to-openapi): created initial library package with tests

# @scalar/release-notes

## 0.1.9

## 0.1.8

### Patch Changes

- [#9983](https://github.com/scalar/scalar/pull/9983): Bump the `zod` catalog to `^4.4.3` so the standalone bundle ships a single `zod` instead of two (`4.3.5` from `@scalar/types` plus `4.4.3` from the `ai` / `@ai-sdk` peer). This makes `standalone.js` ~68KB raw / ~18KB gzip smaller.

## 0.1.7

### Patch Changes

- [#9941](https://github.com/scalar/scalar/pull/9941): Republish every package through npm trusted publishing. No functional changes.

## 0.1.6

## 0.1.5

## 0.1.4

### Patch Changes

- [#9719](https://github.com/scalar/scalar/pull/9719): docs: update the Scalar platform overview block in the README

## 0.1.3

### Patch Changes

- [#9710](https://github.com/scalar/scalar/pull/9710): Republish so the updated README (with the Scalar platform overview) reaches npm. Also renames the README generator metadata in package.json from `readme` to `scalarReadme`: npm treats a `readme` field as the readme text itself, so affected packages were published with a literal `[object Object]` readme on the registry instead of README.md.

## 0.1.2

## 0.1.1

### Patch Changes

- [#9566](https://github.com/scalar/scalar/pull/9566): feat: add a publishable release notes generator package.

# @scalar/openapi-parser

## 0.19.0

### Minor Changes

- 952bde2: feat(json-magic): move json tooling to the new package
- 2888e18: feat(openapi-parser): partial bundle to a depth

## 0.18.3

### Patch Changes

- c345d2c: fix: added dependency on @scalar/openapi-types
- Updated dependencies [ccf875a]
  - @scalar/openapi-types@0.3.7

## 0.18.2

### Patch Changes

- 1c2b9f3: feat: add application and accessCode to swagger 2 upgrader

## 0.18.1

### Patch Changes

- 2d7f995: refactor: use more common straight apostrophe ' instead of the real apostrophe ’

## 0.18.0

### Minor Changes

- 291f09d: feat(openapi-parser): ensure unique hashes and support custom compression

## 0.17.0

### Minor Changes

- f823d45: feat(openapi-parser): introduce parseJson and parseYaml plugins for bundler

### Patch Changes

- 166e298: feat(openapi-parser): correctly set the base origin for string inputs for the bundler
- 4156f1d: Expand workspace store integration
- 37c90b8: feat: add x-webhooks upgrade to the upgrader

## 0.16.0

### Minor Changes

- 11fabae: fix(openapi-parser): webpack bundle errors because of the barrel files

## 0.15.0

### Minor Changes

- b9dacba: fix(openapi-parser): multi entry build for bundler plugins
- a73e9be: chore(openapi-parser): bring back pipeline syntax
- f4332eb: feat: external reference resolution and partial bundle of the openapi document

### Patch Changes

- 17bc0d8: fix: collectionFormat is not migrated to new style and explode keywords
- 49c04cf: fix(openapi-parser): use dynamic imports inside the plugin

## 0.14.0

### Minor Changes

- ee3eb77: feat(openapi-parser): bundle openapi documents

## 0.13.0

### Minor Changes

- 1e87feb: fix: normalize doesn’t handle empty documents well

## 0.12.0

### Minor Changes

- edf694b: feat: remove wildcard exports

## 0.11.1

### Patch Changes

- ea20eb4: fix: swagger upgrade fails if you pass something that is not an object

## 0.11.0

### Minor Changes

- 483ca93: chore: require Node 20 (or above)

### Patch Changes

- bd602d3: chore: mark pipeline syntax as deprecated
- 1d1470c: feat: speed up the upgrade utility

## 0.10.17

### Patch Changes

- 8c7bad8: chore: move build tooling to esbuild

## 0.10.16

### Patch Changes

- c5047ee: fix: hotfix to revert the external reference commit

## 0.10.15

### Patch Changes

- 4abe4f8: feat: add resolveInternalRefs to bundle documents
- 4abe4f8: feat: external $ref’s (absolute and relative URLs)

## 0.10.14

### Patch Changes

- cf5bf65: fix: migrate file type, basic auth, parameters and responses headers correctly

## 0.10.13

### Patch Changes

- d5a687f: fix: byte format is ignored when upgrading from OpenAPI 3.0 to OpenAPI 3.1

## 0.10.12

### Patch Changes

- cbc1d08: fix: swagger 2.0 basePath is ignored, if there’s no host

## 0.10.11

### Patch Changes

- 0f13162: chore: enable more Biome flags, apply linter fixes

## 0.10.10

### Patch Changes

- 0d8a24f: chore: remove Swagger 2.0 upgrade warning

## 0.10.9

### Patch Changes

- c10bbf5: chore: code style

## 0.10.8

### Patch Changes

- e350f23: chore: code style

## 0.10.7

### Patch Changes

- 1223c1f: chore: code style

## 0.10.6

### Patch Changes

- 4de3124: feat: make 'null' the second type in an array when upgrading
- 34e6f52: feat: upgrade to stricter tsconfig

## 0.10.5

### Patch Changes

- a30e7cc: fix: package doesn’t work with `moduleResolution: NodeNext`

## 0.10.4

### Patch Changes

- 64df4fc: fix: example arrays are transformed to objects

## 0.10.3

### Patch Changes

- 8dce84f: Call `onDereference` after dereference process

## 0.10.2

### Patch Changes

- 3791738: fix(openapi-parser): correct schema upgrade for "format: binary"

## 0.10.1

### Patch Changes

- c263aaf: feat: better deal with empty OpenAPI documents

## 0.10.0

### Minor Changes

- fbef0c3: fix(openapi-parser): improve performance

### Patch Changes

- fbef0c3: fix: doesn’t validate files with external references

## 0.9.0

### Minor Changes

- 6fef2f3: feat(openapi-parser): support `onDereference` option on `dereference`

## 0.8.10

### Patch Changes

- 98e9cb2: feat: new `sanitize` utility to make documents OpenAPI-compliant

## 0.8.9

### Patch Changes

- 757fade: fix: when migrating example to example objects, the example should be inside the value attribute
- a607115: feat: add openapi 3.0.4 and openapi 3.1.1

## 0.8.8

### Patch Changes

- 7323370: Allow relative URLs in v3.1 documents

## 0.8.7

### Patch Changes

- 6394a5d: chore: switch to @scalar/build-tooling

## 0.8.6

### Patch Changes

- d064a78: chore: make examples an array if it’s in a schema
- 3db9355: feat: upgrade Swagger 2.0 securityDefinitions

## 0.8.5

### Patch Changes

- 983a5e4: feat: self reference the document
- aee166c: fix: server URLs with variables are considered not valid

## 0.8.4

### Patch Changes

- 96c921c: feat: upgrade Swagger 2.0 formData parameters

## 0.8.3

### Patch Changes

- 674922f: chore: update fetch global tests

## 0.8.2

### Patch Changes

- 6bb85a5: feat: `openapi()` returns dynamic types based on the chained commands

## 0.8.1

### Patch Changes

- 5bd8337: feat: upgrade from Swagger 2.0 (experimental)

## 0.8.0

### Minor Changes

- b4f9f97: feat: new @scalar/openapi-types package

### Patch Changes

- b4f9f97: feat: add literal versions to OpenAPI.Document types
- b4f9f97: feat: types: allow to type custom extensions
- b4f9f97: feat: types: allow any attribute in schemas
- b231e7d: fix: upgrade returns correct OpenAPI document version type
- b4f9f97: feat: expose more types under the OpenAPI namespace

## 0.7.2

### Patch Changes

- 89dd0ef: feat: validate and dereference, throwOnError option

## 0.7.1

### Patch Changes

- 5e2c2d1: fix: read files export is wrong

## 0.7.0

### Minor Changes

- ec01324: refactor!: use dedicated entrypoints for the plugins

### Patch Changes

- c6944f2: fix: ajv import broken in CJS environments

## 0.6.0

### Minor Changes

- 61252ab: refactor!: most functions return an object now

### Patch Changes

- c9dd499: feat: intercept fetch requests
- 61252ab: fix: max call stack exceeded error

## 0.5.0

### Minor Changes

- 10bd75c: chore: switch to rollup to make the library tree shakeable

## 0.4.1

### Patch Changes

- 1023e0a: chore: reduce bundle size

## 0.4.0

### Minor Changes

- 0b7d7be: refactor!: resolve is renamed to dereference
- 63f72b4: refactor!: new OpenAPI types, removed the ResolvedOpenAPI types
- 0b7d7be: refactor!: when using the pipeline syntax all tasks are queued and only executed when you add .get(), .toJson() or toYaml()
- 56e7033: feat: file references
- 0b7d7be: chore!: remove `loadFiles` utility, use `load` instead

### Patch Changes

- 03569c8: fix: existsSync is not a function
- 6436ae1: refactor: resolve should resolve (and not validate)

## 0.3.2

### Patch Changes

- 02ea440: fix: make errors easier to consume

## 0.3.1

### Patch Changes

- 2498fc2: fix: make new parser behave like previous one on missing info.version

## 0.3.0

### Minor Changes

- c28d766: fix: circular references can not be resolved
- c28d766: fix: references inside references are not resolved
- c28d766: refactor: rewrote the whole parser (again)

### Patch Changes

- 0e98fdb: chore: add light-weight browser polyfill to join paths

## 0.2.0

### Minor Changes

- bf4568e: refactor: rewrite the whole package :)

## 0.1.0

### Minor Changes

- fb3b15f: init :)

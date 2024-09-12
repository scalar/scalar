# @scalar/openapi-parser

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

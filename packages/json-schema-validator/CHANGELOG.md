# @scalar/json-schema-validator

## 0.1.4

## 0.1.3

## 0.1.2

### Patch Changes

- [#10202](https://github.com/scalar/scalar/pull/10202): Explain invalid URI references and OpenAPI component names, and return parser errors for malformed reference escapes.

## 0.1.1

## 0.1.0

### Minor Changes

- [#9967](https://github.com/scalar/scalar/pull/9967): Add `@scalar/json-schema-validator`, a standalone engine that validates documents against a JSON Schema with Ajv and returns human-friendly errors. It is the shared core that `@scalar/openapi-validator` now builds on (and that a future AsyncAPI validator can reuse).

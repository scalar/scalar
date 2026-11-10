# @scalar/json-schema-validator

## 0.1.19

### Patch Changes

- [#10951](https://github.com/scalar/scalar/pull/10951): Use shortest round-trip decimal values consistently for multipleOf checks, including large JSON integers and positive exponents. Fast-path safe integers and share keyword registration across validators.
- [#10951](https://github.com/scalar/scalar/pull/10951): Validate decimal `multipleOf` constraints with exact decimal arithmetic, accepting values such as `19.99` and `1000000.19` for `multipleOf: 0.01` while rejecting nonmultiples without a floating-point tolerance.
- [#10959](https://github.com/scalar/scalar/pull/10959): Reduce repeated schema compilation in decimal validation tests to avoid CI timeouts.

## 0.1.18

## 0.1.17

## 0.1.16

## 0.1.15

## 0.1.14

### Patch Changes

- [#10721](https://github.com/scalar/scalar/pull/10721): Update compatible dependencies while retaining the existing Node.js support and five-day release-age policy.

## 0.1.13

### Patch Changes

- [#10614](https://github.com/scalar/scalar/pull/10614): Clean up lint warnings while preserving runtime behavior, and document intentional schema and type syntax.

## 0.1.12

## 0.1.11

## 0.1.10

## 0.1.9

## 0.1.8

## 0.1.7

## 0.1.6

## 0.1.5

## 0.1.4

## 0.1.3

## 0.1.2

### Patch Changes

- [#10202](https://github.com/scalar/scalar/pull/10202): Explain invalid URI references and OpenAPI component names, and return parser errors for malformed reference escapes.

## 0.1.1

## 0.1.0

### Minor Changes

- [#9967](https://github.com/scalar/scalar/pull/9967): Add `@scalar/json-schema-validator`, a standalone engine that validates documents against a JSON Schema with Ajv and returns human-friendly errors. It is the shared core that `@scalar/openapi-validator` now builds on (and that a future AsyncAPI validator can reuse).

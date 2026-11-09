# Dependency patches

## proto-parser 0.0.9

The AsyncAPI Protobuf reader uses this parser to avoid shipping the Protobuf
serialization runtime. Keep the patch while this version is installed:

- Preserve the literal `optional` rule and leave unlabeled proto3 fields without
  a rule. The renderer needs to distinguish explicit and implicit presence.
- Preserve enum-value comments and options in the JSON AST. Dropping options
  would also prevent Scalar from rejecting unsupported custom options.
- Accept a default syntax supplied by AsyncAPI `schemaFormat` for fragments
  without a `syntax` declaration. An explicit declaration still takes precedence
  and Scalar checks it against `schemaFormat`.
- Include field discriminants in the JSON AST and correct the corresponding
  TypeScript declarations for options, ranges, groups, and nested definitions.

Scalar disables the parser's type resolution and retains its own lexical lookup
and semantic validation. Regression coverage lives in
`packages/api-reference/src/helpers/asyncapi-schema/protobuf/`.

When updating or replacing this dependency, run the schema reader tests before
removing any part of the patch.

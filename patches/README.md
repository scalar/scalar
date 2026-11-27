# Dependency patches

## pbkit 0.0.72

Keep Protobuf keywords, labels, and special literals from consuming the start
of an identifier. The AsyncAPI schema reader tests cover enum defaults such as
`infinite` and type names such as `repeatedItem`.

Allow sufficient lookahead for compact valid schemas while keeping a step limit proportional to the source length.

Keep a block comment adjacent when a single newline separates it from its declaration.

Preserve inline descriptions when they belong to the next declaration.

Recognize Protobuf string escapes in proto2 defaults and structured file options. Keep consecutive line comments together.

Require complete numeric tokens in structured file options, including hexadecimal values.

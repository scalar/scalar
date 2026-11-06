# Native schema documentation readers

These readers produce a bounded documentation tree, not a validation schema or a runtime codec. `read-schema.ts` dispatches on the declared language and version and returns `undefined` when reading fails. The UI then displays the original source. `to-display-schema.ts` adapts the tree for Scalar's shared Schema component; its output never enters workspace-store resolution, request validation, or JSON example generation.

Each language has its own directory, implementation, baseline tests, specification-derived tests, and parser-to-display tests. Helper tests run in Node because the readers do not depend on the browser. The Vue tests cover integration and preservation of the original source.

## Specification coverage and limits

| Reader | Specification sections exercised | Deliberate boundaries |
| --- | --- | --- |
| Avro 1.8.2 / 1.9.0 | Primitive and complex schemas; depth-first name definitions, namespaces and recursion; union uniqueness; reader defaults; enum defaults by version; aliases and field order; logical-type validity and underlying-type fallback | Schema declarations only, not Avro IDL, protocols, serialization, or writer/reader compatibility. Integer defaults outside JavaScript's exact range retain source. Unknown custom metadata does not alter the structure. |
| RAML 1.0 | Built-in types; property declarations and literal question marks; default-type inference; array/union grammar; compatible facets, bounds and formats; schema alias; YAML fragments and aliases | Standalone built-in data-type declarations only. Named types, libraries, includes, inheritance, inline `type: { ... }` refinement, pattern properties, discriminators, XML serialization, and user-defined facets retain source. Facets are documentation, not a complete instance validator. |
| Protobuf 2 / 3 | Native scalar types; lexical name lookup; nested/recursive messages; enum values, aliases and scope; maps; field numbers and reservations; presence and oneofs; default and packed-field restrictions; comments and supported options | No imports, services, groups, extensions, editions, or custom options. Values requiring imprecise numeric defaults retain source. Syntax support is bounded by protobufjs; this is not a replacement for protoc. |

Avro accepts parsed schema objects and JSON source text. The `+yaml` media type also permits YAML source text. For inline Protobuf without a syntax statement, the explicitly declared `schemaFormat` version supplies the syntax. This differs from a standalone unversioned `.proto` file, for which the language defaults to proto2.

`protobufjs` 7.5.4 has behaviors that require adapter checks: root-first/descendant lookup, inclusive parsed reserved ranges versus exclusive lookup endpoints, and enum `reserved ... max` being reduced to the field-number limit. Lexical resolution and reservation checks are explicit here. Enum reserved ranges ending at that ambiguous limit conservatively retain source rather than risk documenting a forbidden value. Imported files are never loaded.

Source text is limited to 200,000 characters at dispatch; tree expansion is limited to 2,000 nodes and depth 40. YAML alias expansion is also bounded. These are documentation limits: a valid schema can intentionally fall back to source when it exceeds them.

## Sources

- [Avro 1.8.2 specification](https://avro.apache.org/docs/1.8.2/spec.html)
- [Avro 1.9.0 specification](https://avro.apache.org/docs/1.9.0/spec.html)
- [RAML 1.0 specification](https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md)
- [Protobuf proto2 specification](https://protobuf.dev/reference/protobuf/proto2-spec/) and [language guide](https://protobuf.dev/programming-guides/proto2/)
- [Protobuf proto3 specification](https://protobuf.dev/reference/protobuf/proto3-spec/) and [language guide](https://protobuf.dev/programming-guides/proto3/)

Tests use independently authored examples derived from the rules in these sections, including counterexamples and boundaries. Passing them establishes regression coverage for this supported subset, not complete language conformance.

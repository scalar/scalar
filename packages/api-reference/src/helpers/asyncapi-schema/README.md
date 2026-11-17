# Native schema documentation readers

These readers produce a bounded documentation tree, not a validation schema or a runtime codec. `read-schema.ts` dispatches on the declared language and version and returns `undefined` when reading fails. The UI then displays the original source. `to-display-schema.ts` adapts the tree for Scalar's shared Schema component; its output never enters workspace-store resolution, request validation, or JSON example generation.

Each language has its own directory, implementation, baseline tests, specification-derived tests, and parser-to-display tests. Helper tests run in Node because the readers do not depend on the browser. The Vue tests cover integration and preservation of the original source.

## Specification coverage and limits

| Reader | Specification sections exercised | Deliberate boundaries |
| --- | --- | --- |
| Avro 1.8.2 / 1.9.0 | Primitive and complex schemas; depth-first name definitions, namespaces and recursion; union uniqueness; reader defaults; enum defaults by version; aliases and field order; logical-type validity and underlying-type fallback | Schema declarations only, not Avro IDL, protocols, serialization, or writer/reader compatibility. Integer defaults outside JavaScript's exact range retain source. Unknown custom metadata does not alter the structure. |
| RAML 1.0 | Built-in types; property declarations and literal question marks; default-type inference; array/union grammar; compatible facets, bounds and formats; schema alias; YAML fragments and aliases | Data-type fragments with includes and file-scoped libraries. Structural inheritance, inline `type: { ... }` refinement, pattern properties, discriminators, XML serialization, and user-defined facets retain source. Facets are documentation, not a complete instance validator. |
| Protobuf 2 / 3 | Native scalar types; lexical name lookup; nested/recursive messages; enum values, aliases and scope; maps; field numbers and reservations; presence and oneofs; default and packed-field restrictions; comments and supported options | No weak imports, services, groups, extensions, editions, or custom options. Values requiring imprecise numeric defaults retain source. Syntax support is bounded by protobufjs; this is not a replacement for protoc. |

Avro accepts parsed schema objects and JSON source text. The `+yaml` media type also permits YAML source text. For inline Protobuf without a syntax statement, the explicitly declared `schemaFormat` version supplies the syntax. This differs from a standalone unversioned `.proto` file, for which the language defaults to proto2.

`protobufjs` 7.5.4 has behaviors that require adapter checks: root-first/descendant lookup, inclusive parsed reserved ranges versus exclusive lookup endpoints, and enum `reserved ... max` being reduced to the field-number limit. Lexical resolution and reservation checks are explicit here. Enum reserved ranges ending at that ambiguous limit conservatively retain source rather than risk documenting a forbidden value. Imported files are loaded through the workspace resource loaders.

Source text is limited to 200,000 characters at dispatch; tree expansion is limited to 2,000 nodes and depth 40. YAML alias expansion is also bounded. These are documentation limits: a valid schema can intentionally fall back to source when it exceeds them.

## Sources

- [Avro 1.8.2 specification](https://avro.apache.org/docs/1.8.2/spec.html)
- [Avro 1.9.0 specification](https://avro.apache.org/docs/1.9.0/spec.html)
- [RAML 1.0 specification](https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md)
- [Protobuf proto2 specification](https://protobuf.dev/reference/protobuf/proto2-spec/) and [language guide](https://protobuf.dev/programming-guides/proto2/)
- [Protobuf proto3 specification](https://protobuf.dev/reference/protobuf/proto3-spec/) and [language guide](https://protobuf.dev/programming-guides/proto3/)

Tests use independently authored examples derived from the rules in these sections, including counterexamples and boundaries. Passing them establishes regression coverage for this supported subset, not complete language conformance.

## External RAML and Protobuf dependencies

Workspace loading resolves RAML `!include` fragments and `uses` libraries and Protobuf imports before the native reader runs. Relative paths use the containing file, including nested dependencies. Inline schemas use the API description's source URL or file path. When that location is unknown, relative dependencies retain source fallback instead of using the current web page or process directory.

The browser uses the existing source `fetch` override, so callers can provide authenticated responses or virtual files there. Normal browser CORS rules still apply. Workspace-store callers in non-browser environments can use their existing `fileLoader`. Server workspaces use `documentLoading.basePath` for confined file loading and retain the existing private-network policy. No API security scheme credentials are automatically attached to these downloads. Server-prepared graphs travel with inline schemas into SSR/static chunks; external AsyncAPI references continue to resolve lazily with their own source location.

Each dependency graph is limited to 64 external files, 20 dependency levels, 200,000 characters per file, and 1,000,000 characters total. Repeated downloads are shared within a load. Cyclic file dependencies, missing resources, unsupported constructs and unresolved names retain the original whole-schema source. Recursive named RAML types and Protobuf messages remain supported within acyclic file graphs.

RAML aliases belong to the file declaring `uses`; chained aliases across libraries are rejected. Named types can be used in unions and arrays. Typed example fragments, structural refinement of an inherited object, and other unsupported RAML facets continue to retain source. Protobuf imports retain package names and lexical lookup, with direct and public-import visibility. Each imported file uses its own syntax; an imported file without a syntax declaration defaults to proto2. Weak imports, services, extensions and editions retain source. Avro support remains self-contained; this does not introduce an Avro import or registry convention.

Dependency downloads remain eager so a loaded schema can render synchronously. One ingestion shares a cache and permits at most 64 distinct dependency URLs and 1,000,000 dependency characters across all of its graphs; schemas exceeding that aggregate budget retain source fallback. Per-graph limits still apply. Repeated RAML includes and library aliases share YAML parsing while keeping expansion and file-local scopes separate. The renderer enforces 20 dependency levels separately from its 40-level schema-tree budget. Only typed included DataType/Library fragments can declare `uses`; untyped fragments can consume the declaring scope.

AsyncAPI 2.x inline native payloads, including formats inherited from local message traits, are prepared before their channel structure is upgraded. Its message-level `schemaFormat` applies to the payload; application headers retain their JSON Schema interpretation. Prepared resources remain in workspace/SSR snapshots so server-only files stay available to the browser. Editable and saved API descriptions strip those generated resources and reload dependencies after edits.

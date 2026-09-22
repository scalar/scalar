# Multipart request encoding

Part content types follow the [OpenAPI 3.2.1 Encoding Object defaults](https://spec.openapis.org/oas/v3.2.1.html#encoding-object): a supplied schema without `type`, or a string schema with `contentEncoding`, defaults to `application/octet-stream`. A schema without `type` accepts many values, but the encoding default is still binary. With no supplied schema, the editor infers a type from the example; a Blob supplies its own media type when available.

An explicit `prefixEncoding` or `itemEncoding` content type replaces the schema default for that position. Prefix entries apply only to their matching indexes; `itemEncoding` applies after the prefix ends, without inheriting a prefix entry.

For comma-separated encoding choices, a matching wildcard uses the inferred concrete essence and retains the author's parameters. If nothing matches, the first concrete choice wins. If every choice is a nonmatching wildcard, the inferred type wins without parameters from those unrelated ranges. These are client selection policies; a wire Content-Type cannot contain a wildcard.

Structured XML parts pass through `serializeXmlPart` in `request-example/xml`. Its current legacy implementation uses `xml.name` or a stable `root`, independently of the number of properties. Serialized XML strings pass through unchanged. Full schema-aware XML handling belongs to [the shared XML serializer work in #10192](https://github.com/scalar/scalar/pull/10192); this adapter is its integration point and does not yet implement attributes, namespaces, or all XML Object rules.

Boundaries use 192 random bits and a fixed length so distinct boundaries cannot be prefixes of one another. Serialization retries boundaries that occur in resolved text or nested delimiters, and fails after ten collisions. Binary files remain opaque Blob chunks; their collision protection comes from the random boundary, without decoding or buffering file contents.

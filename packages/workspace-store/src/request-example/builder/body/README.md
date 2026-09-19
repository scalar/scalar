# Multipart request encoding

Part content types follow the [OpenAPI 3.2.1 Encoding Object defaults](https://spec.openapis.org/oas/v3.2.1.html#encoding-object): a supplied schema without `type`, or a string schema with `contentEncoding`, defaults to `application/octet-stream`. A schema without `type` accepts many values, but the encoding default is still binary. With no supplied schema, the editor infers a type from the example; a Blob supplies its own media type when available.

For comma-separated encoding choices, a matching wildcard uses the inferred concrete essence and retains the author's parameters. If nothing matches, the first concrete choice wins. If every choice is a nonmatching wildcard, the inferred type wins without parameters from those unrelated ranges. These are client selection policies; a wire Content-Type cannot contain a wildcard.

Structured XML parts pass through `serializeXmlPart` in `request-example/xml`. Its current legacy implementation uses `xml.name` or a stable `root`, independently of the number of properties. Serialized XML strings pass through unchanged. Full schema-aware XML handling belongs to the XML serializer work; this adapter is its integration point and does not yet implement attributes, namespaces, or all XML Object rules.

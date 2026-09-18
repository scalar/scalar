# Whole-query parameters

[`in: querystring`](https://spec.openapis.org/oas/v3.2.1.html#parameter-object) represents the complete query rather than a named query field. The outgoing workspace-store helper and incoming mock-server helper are complementary: request serialization chooses the media representation, while parsing reconstructs that representation before schema validation.

Example provenance determines encoding:

- A parameter-level `serializedValue` is URI-ready and is sent verbatim.
- A media-level `serializedValue`, or a legacy string `value`, is already media-serialized but still needs URI encoding for non-form content.
- `dataValue`, non-string `value`, and schema-generated values need media serialization before URI encoding. A generated JSON string therefore remains quoted JSON data.

Non-form query values are opaque: JSON delimiters and reserved characters are percent-encoded instead of becoming query separators. Use parameter-level `serializedValue` only when supplying correctly escaped, URI-ready content; invalid URI escapes or invalid JSON are preserved by the client and rejected with a 422 validation response by the mock server.

Form content supports repeated arrays, JSON property encoding, and the form, spaceDelimited, pipeDelimited, and deepObject encoding rules. `allowReserved` leaves the safe reserved subset readable while preserving escapes for structural query delimiters and `+`; otherwise parsing would change the value or the number of fields. Delimiter-based array styles require values that do not contain their active delimiter. JSON property encoding is available when data needs to preserve such delimiters unambiguously.

OpenAPI makes named query parameters and a whole-query parameter mutually exclusive. Existing descriptions that contain both remain tolerated: the whole-query value comes first, followed by named parameters. This is compatibility behavior, not an authoring recommendation. Editing an inline example replaces `externalValue`, because it now supplies a new inline source.

For whole-query validation, absent schemas skip validation, `{}` and `true` allow any value, and `false` rejects every value. Required-parameter presence is checked separately. Empty objects were always truthy in JavaScript; the explicit absence guard preserves boolean-false schemas rather than changing empty-object behavior.

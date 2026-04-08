/**
 * Reference object
 *
 * A simple object to allow referencing other components in the OpenAPI Description, internally and externally.  The `$ref` string value contains a URI [RFC3986](https://tools.ietf.org/html/rfc3986), which identifies the value being referenced.  See the rules for resolving [Relative References](#relative-references-in-api-description-uris).
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#reference-object}
 */
export type ReferenceObject = {
  $ref?: string
  /** A short summary which by default SHOULD override that of the referenced component. If the referenced object-type does not allow a `summary` field, then this field has no effect. */
  summary?: string
  /** A description which by default SHOULD override that of the referenced component. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. If the referenced object-type does not allow a `description` field, then this field has no effect. */
  description?: string
}

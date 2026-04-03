/**
 * External Documentation object
 *
 * Allows referencing an external resource for extended documentation.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#external-documentation-object}
 */
export type ExternalDocumentationObject = {
  /** A description of the target documentation. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** **REQUIRED**. The URL for the target documentation. This MUST be in the form of a URL. */
  url: string
}

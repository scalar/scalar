/**
 * External Documentation object
 *
 * Allows referencing an external resource for extended documentation.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#external-documentation-object}
 */
export type ExternalDocumentationObject = {
  /** A description of the target documentation. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** **REQUIRED**. The URI for the target documentation. This MUST be in the form of a URI. */
  url: string
} & Record<`x-${string}`, unknown>

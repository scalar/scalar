/**
 * External Documentation object
 *
 * Allows referencing an external resource for extended documentation.
 *
 * @see {@link https://swagger.io/specification/v2/#external-documentation-object}
 */
export type ExternalDocsObject = {
  /** A short description of the target documentation. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** **Required.** The URL for the target documentation. Value MUST be in the format of a URL. */
  url: string
}

import type { Extensions } from './schema'
/**
 * External Documentation object
 *
 * Allows referencing an external resource for extended documentation.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#external-documentation-object}
 */
export type ExternalDocsObject = {
  /** A short description of the target documentation. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** **Required.** The URL for the target documentation. Value MUST be in the format of a URL. */
  url: string
} & Extensions

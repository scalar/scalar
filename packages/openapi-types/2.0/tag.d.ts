import type { ExternalDocsObject } from './external-docs'
/**
 * Tag object
 *
 * Allows adding meta data to a single tag that is used by the [Operation Object](#operation-object). It is not mandatory to have a Tag Object per tag used there.
 *
 * @see {@link https://swagger.io/specification/v2/#tag-object}
 */
export type TagObject = {
  /** **Required.** The name of the tag. */
  name: string
  /** A short description for the tag. [GFM syntax](https://guides.github.com/features/mastering-markdown/#GitHub-flavored-markdown) can be used for rich text representation. */
  description?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocsObject
}

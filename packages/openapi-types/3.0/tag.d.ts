import type { ExternalDocumentationObject } from './external-documentation'
/**
 * Tag object
 *
 * Adds metadata to a single tag that is used by the [Operation Object](#operation-object). It is not mandatory to have a Tag Object per tag defined in the Operation Object instances.
 *
 * @see {@link https://spec.openapis.org/oas/v3.0.4#tag-object}
 */
export type TagObject = {
  /** **REQUIRED**. The name of the tag. */
  name: string
  /** A description for the tag. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocumentationObject
}

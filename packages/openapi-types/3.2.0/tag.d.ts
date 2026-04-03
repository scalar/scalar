import type { ExternalDocumentationObject } from './external-documentation'
/**
 * Tag object
 *
 * Adds metadata to a single tag that is used by the [Operation Object](#operation-object). It is not mandatory to have a Tag Object per tag defined in the Operation Object instances.
 *
 * @see {@link https://spec.openapis.org/oas/v3.2#tag-object}
 */
export type TagObject = {
  /** **REQUIRED**. The name of the tag. Use this value in the `tags` array of an Operation. */
  name: string
  /** A short summary of the tag, used for display purposes. */
  summary?: string
  /** A description for the tag. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Additional external documentation for this tag. */
  externalDocs?: ExternalDocumentationObject
  /** The `name` of a tag that this tag is nested under. The named tag MUST exist in the API description, and circular references between parent and child tags MUST NOT be used. */
  parent?: string
  /** A machine-readable string to categorize what sort of tag it is. Any string value can be used; common uses are `nav` for Navigation, `badge` for visible badges, `audience` for APIs used by different groups. A [registry of the most commonly used values](https://spec.openapis.org/registry/tag-kind/) is available. */
  kind?: string
} & Record<`x-${string}`, unknown>

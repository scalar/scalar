import type { ContentObject } from './content'
/**
 * Request Body object
 *
 * Describes a single request body.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.2.md#request-body-object}
 */
export type RequestBodyObject = {
  /** A brief description of the request body. This could contain examples of use. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** **REQUIRED**. The content of the request body. The key is a media type or [media type range](https://tools.ietf.org/html/rfc7231#appendix-D) and the value describes it. The map SHOULD have at least one entry; if it does not, the behavior is implementation-defined. For requests that match multiple keys, only the most specific key is applicable. e.g. `"text/plain"` overrides `"text/*"` */
  content: ContentObject
  /** Determines if the request body is required in the request. Defaults to `false`. */
  required?: boolean
} & Record<`x-${string}`, unknown>

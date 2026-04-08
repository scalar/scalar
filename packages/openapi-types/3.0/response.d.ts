import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { MediaTypeObject } from './media-type'
import type { ReferenceObject } from './reference'
/**
 * Response object
 *
 * Describes a single response from an API operation, including design-time, static `links` to operations based on the response.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#response-object}
 */
export type ResponseObject = {
  /** **REQUIRED**. A description of the response. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description: string
  /** Maps a header name to its definition. [RFC7230](https://tools.ietf.org/html/rfc7230#section-3.2) states header names are case insensitive. If a response header is defined with the name `"Content-Type"`, it SHALL be ignored. */
  headers?: Record<string, HeaderObject | ReferenceObject>
  /** A map containing descriptions of potential response payloads. The key is a media type or [media type range](https://tools.ietf.org/html/rfc7231#appendix-D) and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. `"text/plain"` overrides `"text/*"` */
  content?: Record<string, MediaTypeObject>
  /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for [Component Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.4.md#components-object). */
  links?: Record<string, LinkObject | ReferenceObject>
}

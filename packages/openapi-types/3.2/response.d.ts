import type { ContentObject } from './content'
import type { HeaderObject } from './header'
import type { LinkObject } from './link'
import type { ReferenceObject } from './reference'
/**
 * Response object
 *
 * Describes a single response from an API operation, including design-time, static `links` to operations based on the response.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#response-object}
 */
export type ResponseObject = {
  /** A short summary of the meaning of the response. */
  summary?: string
  /** A description of the response. [CommonMark syntax](https://spec.commonmark.org/) MAY be used for rich text representation. */
  description?: string
  /** Maps a header name to its definition. [RFC9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.1) states header names are case-insensitive. If a response header is defined with the name `"Content-Type"`, it SHALL be ignored. */
  headers?: Record<string, HeaderObject | ReferenceObject>
  /** A map containing descriptions of potential response payloads. The key is a media type or [media type range](https://www.rfc-editor.org/rfc/rfc9110.html#appendix-A) and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. `"text/plain"` overrides `"text/*"` */
  content?: ContentObject
  /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for [Component Objects](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.2.0.md#components-object). */
  links?: Record<string, LinkObject | ReferenceObject>
} & Record<`x-${string}`, unknown>

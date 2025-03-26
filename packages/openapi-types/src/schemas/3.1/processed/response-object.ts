import { z } from 'zod'
import { HeaderObjectSchema } from './header-object'
import { LinkObjectSchema } from './link-object'
import { MediaTypeObjectSchema } from './media-type-object'

/**
 * Response Object
 *
 * Describes a single response from an API operation, including design-time, static links to operations based on the response.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#response-object
 */
export const ResponseObjectSchema = z.object({
  /**
   * REQUIRED. A description of the response. CommonMark syntax MAY be used for rich text representation.
   */
  description: z.string(),
  /**
   * Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is
   * defined with the name "Content-Type", it SHALL be ignored.
   */
  headers: z.record(z.string(), HeaderObjectSchema).optional(),
  /**
   * A map containing descriptions of potential response payloads. The key is a media type or media type range and the
   * value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g.
   * "text/plain" overrides "text/*"
   */
  content: z.record(z.string(), MediaTypeObjectSchema).optional(),
  /**
   * A map of operations links that can be followed from the response. The key of the map is a short name for the link,
   * following the naming constraints of the names for Component Objects.
   */
  links: z.record(z.string(), LinkObjectSchema).optional(),
})

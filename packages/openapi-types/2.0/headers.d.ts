import type { HeaderObject } from './header'
/**
 * Headers object
 *
 * Lists the headers that can be sent as part of a response.
 *
 * @see {@link https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#headers-object}
 */
export type HeadersObject = {
  [key: string]: HeaderObject
}

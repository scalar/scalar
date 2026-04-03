import type { HeaderObject } from './header'
/**
 * Headers object
 *
 * Lists the headers that can be sent as part of a response.
 *
 * @see {@link https://swagger.io/specification/v2/#headers-object}
 */
export type HeadersObject = {
  [key: string]: HeaderObject
}

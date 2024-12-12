/**
 * @description
 * HTTP code snippet generator to generate raw HTTP/1.1 request strings,
 * in accordance to the RFC 7230 (and RFC 7231) specifications.
 *
 * @author
 * @irvinlim
 *
 * For any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

type Http11Options = {
  absoluteURI?: boolean
  autoContentLength?: boolean
  autoHost?: boolean
}
/**
 * Request follows the request message format in accordance to RFC 7230, Section 3.
 * Each section is prepended with the RFC and section number.
 * See more at https://tools.ietf.org/html/rfc7230#section-3.
 */
export declare const http11: Client<Http11Options>
export {}

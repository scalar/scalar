/**
 * @description
 * HTTP code snippet generator for PHP using curl-ext.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

export type CurlOptions = {
  closingTag?: boolean
  maxRedirects?: number
  namedErrors?: boolean
  noTags?: boolean
  shortTags?: boolean
  timeout?: number
}
export declare const curl: Client<CurlOptions>

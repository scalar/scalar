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

export type Http1Options = {
  closingTag?: boolean
  noTags?: boolean
  shortTags?: boolean
}
export declare const http1: Client<Http1Options>

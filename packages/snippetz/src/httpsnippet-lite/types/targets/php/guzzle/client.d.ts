/**
 * @description
 * HTTP code snippet generator for PHP using Guzzle.
 *
 * @author @RobertoArruda
 * @author @erunion
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

export type GuzzleOptions = {
  closingTag?: boolean
  indent?: string
  noTags?: boolean
  shortTags?: boolean
}
export declare const guzzle: Client<GuzzleOptions>

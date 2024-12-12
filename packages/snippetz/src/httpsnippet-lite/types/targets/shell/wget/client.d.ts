/**
 * @description
 * HTTP code snippet generator for the Shell using Wget.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

export type WgetOptions = {
  short?: boolean
  verbose?: boolean
}
export declare const wget: Client<WgetOptions>

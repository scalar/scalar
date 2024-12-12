/**
 * @description
 * HTTP code snippet generator for Objective-C using NSURLSession.
 *
 * @author
 * @thibaultCha
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

export type NsurlsessionOptions = {
  pretty?: boolean
  timeout?: number
}
export declare const nsurlsession: Client<NsurlsessionOptions>

/**
 * @description
 * HTTP code snippet generator for the Shell using HTTPie.
 *
 * @author
 * @AhmadNassri
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

export type HttpieOptions = {
  body?: boolean
  cert?: boolean
  headers?: boolean
  pretty?: boolean
  print?: boolean
  queryParams?: boolean
  short?: boolean
  style?: boolean
  timeout?: boolean
  verbose?: boolean
  verify?: boolean
}
export declare const httpie: Client<HttpieOptions>

import type { Client } from '../../targets.js'

/**
 * @description
 * HTTP code snippet generator for R using httr
 *
 * @author
 * @gabrielakoreeda
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
export type HttrOptions = {
  /** @default '  ' */
  indent?: string
}

export declare const httr: Client

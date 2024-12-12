/**
 * @description
 * HTTP code snippet generator for fetch
 *
 * @author
 * @pmdroid
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import type { Client } from '../../targets.js'

type FetchOptions = {
  credentials?: Record<string, string> | null
}
export declare const fetch: Client<FetchOptions>
export {}

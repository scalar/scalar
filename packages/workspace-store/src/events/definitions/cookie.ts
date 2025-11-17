import type { CollectionType } from '@/events/definitions/common'
import type { XScalarCookie } from '@/schemas/extensions/general/x-scalar-cookies'

/** Event definitions for all things cookie related */
export type CookieEvents = {
  /**
   * Add OR update a cookie
   */
  'cookie:upsert:cookie': {
    payload: Partial<XScalarCookie>
    index?: number
  } & CollectionType
  /**
   * Delete a cookie by index
   */
  'cookie:delete:cookie': { cookieName: string; index: number } & CollectionType
}

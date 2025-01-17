import { z } from 'zod'

import { nanoidSchema } from '../shared'

export const cookieSchema = z.object({
  uid: nanoidSchema,
  /**  Defines the cookie name and its value. A cookie definition begins with a name-value pair.  */
  name: z.string().default(''),
  value: z.string().default(''),
  /** Defines the host to which the cookie will be sent. */
  domain: z.string().optional(),
  /** Indicates the path that must exist in the requested URL for the browser to send the Cookie header. */
  path: z.string().optional(),
})

/**
 * Cookies
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
 */
export type Cookie = z.infer<typeof cookieSchema>

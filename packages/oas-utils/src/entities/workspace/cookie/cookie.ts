import { deepMerge } from '@/helpers'
import { z } from 'zod'

import { nanoidSchema } from '../shared'

const cookieSchema = z.object({
  uid: nanoidSchema,
  /**  Defines the cookie name and its value. A cookie definition begins with a name-value pair.  */
  name: z.string(),
  value: z.string(),
  /** Defines the host to which the cookie will be sent. */
  domain: z.string().optional(),
  /** Indicates the maximum lifetime of the cookie as an HTTP-date timestamp. See Date for the required formatting. */
  expires: z.date().optional(),
  /**
   * Forbids JavaScript from accessing the cookie, for example, through the Document.cookie property. Note that a cookie
   * that has been created with HttpOnly will still be sent with JavaScript-initiated requests, for example, when
   * calling XMLHttpRequest.send() or fetch(). This mitigates attacks against cross-site scripting (XSS).
   */
  httpOnly: z.boolean().optional(),
  /**
   * Indicates the number of seconds until the cookie expires. A zero or negative number will expire the cookie
   * immediately. If both Expires and Max-Age are set, Max-Age has precedence.
   */
  maxAge: z.number().optional(),
  /** Indicates that the cookie should be stored using partitioned storage. See Cookies Having Independent Partitioned
   * State (CHIPS) for more details.
   */
  partitioned: z.boolean().optional(),
  /** Indicates the path that must exist in the requested URL for the browser to send the Cookie header. */
  path: z.string().optional(),
  /** Controls whether or not a cookie is sent with cross-site requests, providing some protection against cross-site
   * request forgery attacks (CSRF).
   */
  sameSite: z.union([z.literal('Lax'), z.literal('Strict'), z.literal('None')]),
  /**
   * Indicates that the cookie is sent to the server only when a request is made with the https: scheme (except on
   * localhost), and therefore, is more resistant to man-in-the-middle attacks.
   */
  secure: z.boolean().optional(),
})

/**
 * Cookies
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
 */
export type Cookie = z.infer<typeof cookieSchema>
export type CookiePayload = z.input<typeof cookieSchema>

/** Create cookie helper */
export const createCookie = (payload: CookiePayload) =>
  deepMerge(cookieSchema.parse({}), payload)

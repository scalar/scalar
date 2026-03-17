import { Type } from '@scalar/typebox'

/**
 * Pre-request scripts run before a request is sent. They are used to prepare or modify anything needed for the request to succeed.
 *
 * Common uses:
 * - Set up data and variables
 * - Generate timestamps, random values, IDs, or nonces
 * - Set environment or collection variables for use in the URL, headers, or body
 *
 * @example
 * ```yaml
 * x-pre-request: |
 *   var token = pm.environment.get("token")
 *   pm.request.headers.set("Authorization", `Bearer ${token}`)
 * ```
 */
export const XPreRequestSchema = Type.Object({
  'x-pre-request': Type.Optional(Type.String()),
})

export type XPreRequest = {
  'x-pre-request'?: string
}

import { Type } from '@scalar/typebox'

/**
 * Post response scripts allow to execute arbitrary code after a response is received
 *
 * This is useful for:
 * - Extracting data from the response, or
 * - Testing the response
 *
 * @example
 * ```yaml
 * x-post-response: |
 *   pm.test("Status code is 200", () => {
 *     pm.response.to.have.status(200)
 *   })
 * ```
 */
export const XPostResponseSchema = Type.Object({
  'x-post-response': Type.Optional(Type.String()),
})

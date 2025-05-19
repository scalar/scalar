import { z } from 'zod'

/** The code to execute */
export const PostResponseSchema = z.string()

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
export const XPostResponseSchema = z.object({
  'x-post-response': PostResponseSchema.optional(),
})

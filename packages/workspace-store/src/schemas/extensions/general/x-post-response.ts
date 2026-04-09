import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

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

export type XPostResponse = {
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
  'x-post-response'?: string
}

export const XPostResponse = object(
  {
    'x-post-response': optional(
      string({
        typeComment: 'Script to run after a response is received',
      }),
    ),
  },
  {
    typeName: 'XPostResponse',
    typeComment: 'Post-response script for an operation',
  },
)

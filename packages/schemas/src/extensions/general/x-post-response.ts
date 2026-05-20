import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Post response scripts allow to execute arbitrary code after a response is received.
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
export const XPostResponse = object(
  {
    'x-post-response': optional(
      string({
        typeComment: 'Script executed after a response is received',
      }),
    ),
  },
  {
    typeName: 'XPostResponse',
    typeComment: typeCommentWithExample(
      'Post-response script for an operation. Use to extract response data or assert on the response.',
      {
        language: 'yaml',
        body: `x-post-response: |
  pm.test("Status code is 200", () => {
    pm.response.to.have.status(200)
  })`,
      },
    ),
  },
)

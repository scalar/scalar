import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import incorrectSecType from './incorrectSecType.json'

describe('incorrectSecType', () => {
  it('returns an error', async () => {
    const result = await validate(incorrectSecType)

    // This file has multiple errors. One of them is a `description` incorrectly
    // placed in a MediaType object, reported with the JSON Pointer-escaped path
    // to it (each `/` in the path key escaped as `~1`).
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: 'Property description is not expected to be here',
        path: '/paths/~1store~1order/post/requestBody/content/application~1json',
      }),
    )

    // It also has security scheme errors:
    // - jwt has type: "scheme" (should be "http")
    // - petstore_auth has "flow" instead of "flows"
    expect(result.errors?.length).toBe(10)
    expect(result.valid).toBe(false)
  })
})

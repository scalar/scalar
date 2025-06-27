import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import incorrectSecType from './incorrectSecType.json'

describe('incorrectSecType', () => {
  it('returns an error', async () => {
    const result = await validate(incorrectSecType)

    // TODO: Shouldn't this metnion the incorrect security type?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})

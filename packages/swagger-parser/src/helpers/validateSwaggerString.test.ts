import { describe, expect, it } from 'vitest'

import exampleInput from './fixtures/petstore.json'
import { validateSwaggerString } from './validateSwaggerString'

describe('validateSwaggerString', () => {
  it('returns true if valid', async () => {
    const result = await validateSwaggerString(exampleInput)

    expect(result).toBe(true)
  })

  it('return false if invalid', async () => {
    const result = await validateSwaggerString('INVALID')

    expect(result).toBe(false)
  })
})

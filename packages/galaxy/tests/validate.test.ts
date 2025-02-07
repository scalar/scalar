import { validate } from '@scalar/openapi-parser'
import { describe, expect, it } from 'vitest'

import galaxy from '../src/documents/3.1.yaml?raw'

describe('validate', () => {
  it('is valid', async () => {
    const result = await validate(galaxy)

    expect(result.valid).toBe(true)
  })
})

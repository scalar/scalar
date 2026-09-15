import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import license_identifier from './license_identifier.yaml?raw'

describe('license_identifier', () => {
  it('returns an error', async () => {
    const result = await validate(license_identifier)

    // License identifiers are not supported by this OpenAPI 3.0 document.
    expect(result.errors?.[0]?.message).toBe('Property identifier is not expected to be here')
    expect(result.valid).toBe(false)
  })
})

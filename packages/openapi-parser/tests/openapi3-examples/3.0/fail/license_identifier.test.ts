import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import license_identifier from './license_identifier.yaml?raw'

describe('license_identifier', () => {
  it('returns an error', async () => {
    const result = await validate(license_identifier)

    // TODO: Swagger Editor
    //
    // Structural error at info.license
    // should NOT have additional properties
    // additionalProperty: identifier
    expect(result.errors?.[0]?.message).toBe(
      `Property identifier is not expected to be here`,
    )
    expect(result.valid).toBe(false)
  })
})

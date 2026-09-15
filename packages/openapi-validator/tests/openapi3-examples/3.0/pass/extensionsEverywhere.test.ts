import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import extensionsEverywhere from './extensionsEverywhere.yaml?raw'

describe('extensionsEverywhere', () => {
  it('passes', async () => {
    const result = await validate(extensionsEverywhere)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})

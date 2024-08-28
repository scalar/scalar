import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import minimal from './minimal.yaml?raw'

describe('minimal', () => {
  it('passes', async () => {
    const result = await validate(minimal)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})

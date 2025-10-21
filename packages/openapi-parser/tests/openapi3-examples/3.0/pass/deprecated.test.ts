import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import deprecated from './deprecated.yaml?raw'

describe('deprecated', () => {
  it('passes', () => {
    const result = validate(deprecated)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})

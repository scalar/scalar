import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import minimal_comp from './minimal_comp.yaml?raw'

describe('minimal_comp', () => {
  it('passes', () => {
    const result = validate(minimal_comp)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

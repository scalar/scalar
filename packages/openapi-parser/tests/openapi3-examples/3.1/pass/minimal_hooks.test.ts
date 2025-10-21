import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import minimal_hooks from './minimal_hooks.yaml?raw'

describe('minimal_hooks', () => {
  it('passes', () => {
    const result = validate(minimal_hooks)

    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

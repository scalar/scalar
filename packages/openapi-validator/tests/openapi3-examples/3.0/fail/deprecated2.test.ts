import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import deprecated2 from './deprecated2.yaml?raw'

describe('deprecated2', () => {
  it('rejects a string deprecated value', async () => {
    const result = await validate(deprecated2)

    expect(result.errors).toStrictEqual([
      { message: 'type must be boolean', path: '/paths/~1/get/parameters/0/deprecated' },
    ])
    expect(result.valid).toBe(false)
  })
})

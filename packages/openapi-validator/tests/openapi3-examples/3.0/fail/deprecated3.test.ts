import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import deprecated3 from './deprecated3.yaml?raw'

describe('deprecated3', () => {
  it('rejects a string deprecated value', async () => {
    const result = await validate(deprecated3)

    expect(result.errors).toStrictEqual([
      { message: 'type must be boolean', path: '/paths/~1/get/parameters/0/schema/deprecated' },
    ])
    expect(result.valid).toBe(false)
  })
})

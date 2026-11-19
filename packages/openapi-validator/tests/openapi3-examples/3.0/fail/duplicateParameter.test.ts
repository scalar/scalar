import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateParameter from './duplicateParameter.yaml?raw'

describe('duplicateParameter', () => {
  it('returns an error', async () => {
    const result = await validate(duplicateParameter)

    expect(result.errors).toStrictEqual([
      {
        path: '/paths/~1test/get/parameters/1',
        message: 'Duplicate parameter "test" in "query"; first declared at /paths/~1test/get/parameters/0.',
      },
    ])
    expect(result.valid).toBe(false)
  })
})

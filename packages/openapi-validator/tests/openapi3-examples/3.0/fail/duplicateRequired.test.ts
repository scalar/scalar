import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateRequired from './duplicateRequired.yaml?raw'

describe('duplicateRequired', () => {
  it('rejects duplicate required property names', async () => {
    const result = await validate(duplicateRequired)

    expect(result.errors).toStrictEqual([
      {
        message: 'uniqueItems must NOT have duplicate items (items ## 1 and 0 are identical)',
        path: '/components/schemas/test/required',
      },
    ])
    expect(result.valid).toBe(false)
  })
})

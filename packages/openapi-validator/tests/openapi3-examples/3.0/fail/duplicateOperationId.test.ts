import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateOperationId from './duplicateOperationId.yaml?raw'

describe('duplicateOperationId', () => {
  it('returns an error', async () => {
    const result = await validate(duplicateOperationId)

    expect(result.errors).toStrictEqual([
      {
        path: '/paths/~1test2/post/operationId',
        message: 'Duplicate operationId "same"; first declared at /paths/~1test/get/operationId.',
      },
    ])
    expect(result.valid).toBe(false)
  })
})

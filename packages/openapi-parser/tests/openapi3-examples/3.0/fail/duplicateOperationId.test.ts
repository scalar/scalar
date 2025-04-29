import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateOperationId from './duplicateOperationId.yaml?raw'

describe.todo('duplicateOperationId', () => {
  it('returns an error', async () => {
    const result = await validate(duplicateOperationId)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate operationId`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})

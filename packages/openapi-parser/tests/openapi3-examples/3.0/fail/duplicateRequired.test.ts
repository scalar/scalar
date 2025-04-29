import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateRequired from './duplicateRequired.yaml?raw'

describe.todo('duplicateRequired', () => {
  it('returns an error', async () => {
    const result = await validate(duplicateRequired)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate required properties`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})

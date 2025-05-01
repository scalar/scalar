import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import duplicateParameter from './duplicateParameter.yaml?raw'

describe.todo('duplicateParameter', () => {
  it('returns an error', async () => {
    const result = await validate(duplicateParameter)

    expect(result.errors?.[0]?.message).toBe(
      `something something duplicate parameter`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})

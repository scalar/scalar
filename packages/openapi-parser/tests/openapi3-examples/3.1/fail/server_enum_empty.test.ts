import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_empty from './server_enum_empty.yaml?raw'

describe('server_enum_empty', () => {
  it('returns an error', async () => {
    const result = await validate(server_enum_empty)

    expect(result.errors?.[0]?.message).toBe(
      `minItems must NOT have fewer than 1 items`,
    )

    expect(result.valid).toBe(false)
  })
})

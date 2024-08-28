import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import server_enum_empty from './server_enum_empty.yaml?raw'

describe('server_enum_empty', () => {
  it('returns an error', async () => {
    const result = await validate(server_enum_empty)

    // TODO: The error should return something related to the empty enum
    expect(result.errors?.[0]?.message).toBe(
      `format must match format "uri-reference"`,
    )
    expect(result.valid).toBe(false)
  })
})

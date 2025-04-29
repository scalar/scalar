import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_unknown from './server_enum_unknown.yaml?raw'

describe('server_enum_unknown', () => {
  it.todo('returns an error', async () => {
    const result = await validate(server_enum_unknown)

    // TODO: The message should return something related to the unknown enum value
    // expect(result.errors?.[0]?.message).toBe(
    // )
    expect(result.valid).toBe(false)
  })
})

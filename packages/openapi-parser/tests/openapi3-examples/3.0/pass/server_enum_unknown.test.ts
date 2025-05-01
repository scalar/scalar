import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_unknown from './server_enum_unknown.yaml?raw'

describe.todo('server_enum_unknown', () => {
  it('passes', async () => {
    const result = await validate(server_enum_unknown)

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBe(1)
    expect(result.errors?.[0]?.message).toBe(
      'should be equal to one of the allowed values',
    )
  })
})

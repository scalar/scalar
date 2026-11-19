import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_unknown from './server_enum_unknown.yaml?raw'

describe('server_enum_unknown', () => {
  it('passes', async () => {
    const result = await validate(server_enum_unknown)

    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
  })
})

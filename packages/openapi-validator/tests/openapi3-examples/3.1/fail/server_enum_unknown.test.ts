import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_unknown from './server_enum_unknown.yaml?raw'

describe('server_enum_unknown', () => {
  it('returns an error', async () => {
    const result = await validate(server_enum_unknown)

    expect(result.errors).toStrictEqual([
      {
        path: '/servers/0/variables/var/default',
        message: 'Server variable "var" default must be one of its enum values.',
      },
    ])
    expect(result.valid).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import server_enum_empty from './server_enum_empty.yaml?raw'

describe.todo('server_enum_empty', () => {
  it('passes', async () => {
    const result = await validate(server_enum_empty)

    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})

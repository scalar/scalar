import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import schema from './schema.yaml?raw'

describe('schema', () => {
  it('passes', async () => {
    const result = await validate(schema)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

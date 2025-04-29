import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import refEncoding2 from './ref-encoding2.yaml?raw'

describe('ref-encoding2', () => {
  it('passes', async () => {
    const result = await validate(refEncoding2)

    expect(result.errors).toStrictEqual([])
    expect(result.valid).toBe(true)
    expect(result.version).toBe('2.0')
  })
})

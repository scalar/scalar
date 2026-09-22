import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import refEncoding3 from './ref-encoding3.yaml?raw'

describe('ref-encoding3', () => {
  it('passes', async () => {
    const result = await validate(refEncoding3)

    expect(result.errors).toStrictEqual([])
    expect(result.valid).toBe(true)
    expect(result.version).toBe('3.0')
  })
})

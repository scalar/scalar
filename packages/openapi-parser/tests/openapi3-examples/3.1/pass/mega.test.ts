import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index.js'
import mega from './mega.yaml?raw'

describe('mega', () => {
  it('passes', async () => {
    const result = await validate(mega)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

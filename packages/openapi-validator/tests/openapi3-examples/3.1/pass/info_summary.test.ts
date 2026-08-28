import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import info_summary from './info_summary.yaml?raw'

describe('info_summary', () => {
  it('passes', async () => {
    const result = await validate(info_summary)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

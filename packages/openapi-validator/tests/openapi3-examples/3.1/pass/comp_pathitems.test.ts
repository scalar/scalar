import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import comp_pathitems from './comp_pathitems.yaml?raw'

describe('comp_pathitems', () => {
  it('passes', async () => {
    const result = await validate(comp_pathitems)
    expect(result.valid).toBe(true)
    expect(result.errors).toStrictEqual([])
    expect(result.version).toBe('3.1')
  })
})

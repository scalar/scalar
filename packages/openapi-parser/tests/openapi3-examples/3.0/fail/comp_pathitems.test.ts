import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import comp_pathitems from './comp_pathitems.yaml?raw'

describe('comp_pathitems', () => {
  it('returns an error', async () => {
    const result = await validate(comp_pathitems)

    // TODO: Should probably complain about the pathItems?
    expect(result.errors?.[0]?.message).toBe(
      `must have required property 'paths'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})

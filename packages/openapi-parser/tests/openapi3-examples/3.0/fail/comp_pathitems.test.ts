import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import comp_pathitems from './comp_pathitems.yaml?raw'

describe('comp_pathitems', () => {
  it('returns an error for both missing paths and pathItems being present', async () => {
    const result = await validate(comp_pathitems)

    // OpenAPI 3.0 requires a 'paths' object, which is missing here.
    // The file also has pathItems in components which is only valid in 3.1+
    expect(result.errors?.[0]?.message).toBe("must have required property 'paths'")
    expect(result.errors?.[1]?.message).toBe('Property pathItems is not expected to be here')
    expect(result.errors?.length).toBe(2)
    expect(result.valid).toBe(false)
  })
})

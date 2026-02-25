import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import missingPathParam2 from './missingPathParam2.yaml?raw'

describe('missingPathParam2', () => {
  it('returns an error', async () => {
    const result = await validate(missingPathParam2)

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThanOrEqual(1)

    const test2Error = result.errors?.find((e) => e.message?.includes('test2'))
    expect(test2Error).toBeDefined()
    expect(test2Error?.message).toContain(
      'Declared path parameter "test2" needs to be defined as a path parameter at either the path or operation level',
    )
  })
})

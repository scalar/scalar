import { describe, it } from 'vitest'

import { validate } from '../../../../src/index'
import internalPathItemRef from './internalPathItemRef.yaml?raw'

describe.todo('internalPathItemRef', () => {
  it('returns an error', async () => {
    await validate(internalPathItemRef)

    // expect(result.errors?.[0]?.message).toBe(`Can't resolve URI: #/paths/test2`)
    // expect(result.errors?.length).toBe(1)
    // expect(result.valid).toBe(false)
  })
})

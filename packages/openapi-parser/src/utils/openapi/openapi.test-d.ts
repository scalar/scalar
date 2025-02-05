import { describe, expectTypeOf, it } from 'vitest'

import type { Filesystem } from '../../types/index.ts'
import { openapi } from './openapi.ts'

describe('openapi', () => {
  it('returns the correct type for load()', async () => {
    const result = await openapi().load({}).get()

    expectTypeOf(result.filesystem).toMatchTypeOf<Filesystem>()

    // @ts-expect-error `valid` should be undefined
    expectTypeOf(result.valid).toMatchTypeOf<boolean>()
  })

  it('returns the correct type for validate()', async () => {
    const result = await openapi().load({}).validate().get()

    expectTypeOf(result.valid).toMatchTypeOf<boolean>()
  })
})

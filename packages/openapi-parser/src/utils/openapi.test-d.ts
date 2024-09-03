import { describe, expectTypeOf, it } from 'vitest'

import type { Filesystem } from '../types'
import { openapi } from './foobar'

describe('openapi', () => {
  it('returns the correct type for load()', () => {
    const result = openapi().load({}).get()

    expectTypeOf(result.filesystem).toMatchTypeOf<Filesystem>()

    // @ts-expect-error `valid` should be undefined
    expectTypeOf(result.valid).toMatchTypeOf<boolean>()
  })

  it('returns the correct type for validate()', () => {
    const result = openapi().load({}).validate().get()

    expectTypeOf(result.valid).toMatchTypeOf<boolean>()
  })
})

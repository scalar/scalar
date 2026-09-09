import type { UnknownObject } from '@scalar/types/utils'
import { describe, expectTypeOf, it } from 'vitest'

import type { CommandChain, Filesystem, StrictOpenApiDocument } from '../../types/index'
import { openapi } from './openapi'

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

  it('uses the last command result for overlapping fields', () => {
    type Upgraded = CommandChain<[{ name: 'load' }, { name: 'upgrade' }]>
    expectTypeOf<Upgraded['version']>().toEqualTypeOf<'3.1' | '3.2' | undefined>()
    expectTypeOf<Upgraded['filesystem']>().toEqualTypeOf<Filesystem>()

    type Filtered = CommandChain<[{ name: 'validate' }, { name: 'filter' }]>
    expectTypeOf<Filtered['specification']>().toEqualTypeOf<UnknownObject>()

    type Validated = CommandChain<[{ name: 'load' }, { name: 'validate' }]>
    expectTypeOf<Extract<Validated, { valid: true }>['specification']>().toEqualTypeOf<StrictOpenApiDocument>()
    expectTypeOf<Extract<Validated, { valid: false }>['specification']>().toEqualTypeOf<UnknownObject>()
  })
})

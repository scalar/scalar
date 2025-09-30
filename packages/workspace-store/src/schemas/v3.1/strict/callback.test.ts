import type { Static } from '@scalar/typebox'
import type { IsEqual, Simplify } from 'type-fest'
import { describe, it } from 'vitest'

import type { AssertTrue } from '@/schemas/types'

import type { CallbackObject, CallbackObjectSchemaDefinition } from './callback'

describe('callback', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = Simplify<Static<typeof CallbackObjectSchemaDefinition>>
      type TypescriptType = Simplify<CallbackObject>

      // Deep equality check between the types
      type _Test = AssertTrue<IsEqual<SchemaType, TypescriptType>>
      type _Test2 = AssertTrue<IsEqual<TypescriptType, SchemaType>>
    })
  })
})

import type { Static } from '@scalar/typebox'
import type { IsEqual, Simplify } from 'type-fest'
import { describe, it } from 'vitest'

import type { AssertTrue } from '@/schemas/types'

import type { TraversedEntry, TraversedEntrySchemaDefinition } from './navigation'

describe('navigation', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = Simplify<Static<typeof TraversedEntrySchemaDefinition>>
      type TypescriptType = Simplify<TraversedEntry>

      // Deep equality check between the types
      type _ = AssertTrue<IsEqual<SchemaType, TypescriptType>>
      type _2 = AssertTrue<IsEqual<TypescriptType, SchemaType>>
    })
  })
})

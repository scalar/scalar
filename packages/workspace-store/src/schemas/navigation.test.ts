import type { Static } from '@scalar/typebox'
import { describe, it } from 'vitest'

import type { TraversedEntrySchema } from '@/schemas/v3.1/strict/openapi-document'

import type { TraversedEntry } from './navigation'

describe('navigation', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = Static<typeof TraversedEntrySchema>
      type TypescriptType = TraversedEntry

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })
})

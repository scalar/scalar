import { describe, expectTypeOf, it } from 'vitest'

import type { ApiReferenceTranslationKey, ApiReferenceTranslations } from './types'

describe('types', () => {
  it('accepts existing schema translation dictionaries without the extensions label', () => {
    type SchemaTranslations = ApiReferenceTranslations['schema']
    expectTypeOf<Omit<SchemaTranslations, 'extensionCount'>>().toExtend<SchemaTranslations>()
  })

  it('includes the optional extensions label in the translation keys', () => {
    expectTypeOf<'schema.extensionCount'>().toExtend<ApiReferenceTranslationKey>()
  })
})

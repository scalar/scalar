import { describe, expect, it } from 'vitest'

import { getValueByPointer } from './get-value-by-pointer'

describe('get-value-by-pointer', () => {
  const document = {
    components: {
      schemas: {
        User: { type: 'object', properties: { id: { type: 'string' } } },
        'Weird/Key~Name': { type: 'string' },
      },
    },
  }

  it('resolves a pointer to a nested value', () => {
    expect(getValueByPointer(document, '#/components/schemas/User')).toEqual(document.components.schemas.User)
  })

  it('supports a pointer without the leading hash', () => {
    expect(getValueByPointer(document, '/components/schemas/User')).toEqual(document.components.schemas.User)
  })

  it('unescapes ~1 and ~0 segments', () => {
    expect(getValueByPointer(document, '#/components/schemas/Weird~1Key~0Name')).toEqual({ type: 'string' })
  })

  it('follows $refs encountered along the path', () => {
    const target = { type: 'object', properties: { id: { type: 'string' } } }
    const doc = {
      components: {
        schemas: {
          Alias: { '$ref': '#/components/schemas/User', '$ref-value': target },
        },
      },
    }

    expect(getValueByPointer(doc, '#/components/schemas/Alias/properties/id')).toEqual({ type: 'string' })
  })

  it('returns undefined when the pointer does not resolve', () => {
    expect(getValueByPointer(document, '#/components/schemas/Missing')).toBeUndefined()
  })

  it('returns undefined when walking into a non-object', () => {
    expect(getValueByPointer(document, '#/components/schemas/User/properties/id/type/nope')).toBeUndefined()
  })
})

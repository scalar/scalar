import { coerce, object, optional, string } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { recursiveRef } from './reference'

describe('reference', () => {
  const schema = recursiveRef(object({ title: optional(string()) }))

  it('follows a chain of references to the resolved value', () => {
    const result = coerce(schema, {
      $ref: '#/components/schemas/Alias',
      '$ref-value': { $ref: '#/components/schemas/User', '$ref-value': { title: 'User' } },
    })

    expect(result).toMatchObject({ $ref: '#/components/schemas/Alias', '$ref-value': { title: 'User' } })
  })

  it('stops at a reference that points at itself', () => {
    const self: Record<string, unknown> = { $ref: '#/components/schemas/Self' }
    self['$ref-value'] = self

    expect(() => coerce(schema, self)).not.toThrow()
    expect(coerce(schema, self)).toMatchObject({ $ref: '#/components/schemas/Self' })
  })

  it('stops at references that point at each other', () => {
    const a: Record<string, unknown> = { $ref: '#/components/schemas/B' }
    const b: Record<string, unknown> = { $ref: '#/components/schemas/A' }
    a['$ref-value'] = b
    b['$ref-value'] = a

    expect(() => coerce(schema, a)).not.toThrow()
    expect(coerce(schema, a)).toMatchObject({ $ref: '#/components/schemas/B' })
  })
})

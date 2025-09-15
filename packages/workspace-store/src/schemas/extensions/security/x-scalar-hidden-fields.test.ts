import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarHiddenFieldsSchema } from './x-scalar-hidden-fields'

describe('XScalarHiddenFieldsSchema', () => {
  it('allows empty array', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': [],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': [] })
  })

  it('allows single field', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': ['client-id'],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': ['client-id'] })
  })

  it('allows multiple fields', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': ['client-id', 'clientSecret'],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': ['client-id', 'clientSecret'] })
  })

  it('allows all valid field types', () => {
    const allFields = ['client-id', 'clientSecret']

    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': allFields,
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': allFields })
  })

  it('rejects invalid field names', () => {
    expect(() => {
      Value.Parse(XScalarHiddenFieldsSchema, {
        'x-scalar-hidden-fields': ['invalid-field'],
      })
    }).toThrow()
  })

  it('allows undefined when not provided', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {})
    expect(result).toEqual({})
  })
})

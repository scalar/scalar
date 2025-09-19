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
      'x-scalar-hidden-fields': ['client-id', 'client-secret'],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': ['client-id', 'client-secret'] })
  })

  it('allows API key field', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': ['api-key'],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': ['api-key'] })
  })

  it('allows HTTP auth fields', () => {
    const result = Value.Parse(XScalarHiddenFieldsSchema, {
      'x-scalar-hidden-fields': ['username', 'password', 'token'],
    })
    expect(result).toEqual({ 'x-scalar-hidden-fields': ['username', 'password', 'token'] })
  })

  it('allows all valid field types', () => {
    const allFields = ['client-id', 'client-secret', 'api-key', 'username', 'password', 'token']

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

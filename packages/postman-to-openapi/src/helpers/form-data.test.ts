import { describe, expect, it } from 'vitest'

import type { FormParameter } from '@/types'

import { processFormDataSchema } from './form-data'

describe('form-data', () => {
  it('creates schema with string properties', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
      },
      {
        key: 'email',
        value: 'john@example.com',
        type: 'text',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          example: 'john@example.com',
        },
      },
    })
  })

  it('handles file type fields with binary format', () => {
    const formdata: FormParameter[] = [
      {
        key: 'document',
        type: 'file',
        src: null,
      },
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result).toEqual({
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'John Doe',
        },
      },
    })
  })

  it('extracts description from string description', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        description: 'User full name',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name).toEqual({
      type: 'string',
      example: 'John Doe',
      description: 'User full name',
    })
  })

  it('extracts description from object description', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        description: {
          content: 'User full name',
        },
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name).toEqual({
      type: 'string',
      example: 'John Doe',
      description: 'User full name',
    })
  })

  it('marks fields as required when description contains [required]', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        description: 'User full name [required]',
      },
      {
        key: 'email',
        value: 'john@example.com',
        type: 'text',
        description: 'User email',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.required).toEqual(['name'])
    expect(result.properties?.name?.description).toBe('User full name')
  })

  it('removes [required] marker from description', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        description: 'User full name [required]',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name?.description).toBe('User full name')
    expect(result.properties?.name?.description).not.toContain('[required]')
  })

  it('handles empty description in object format', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        description: {
          content: '',
        },
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name).toEqual({
      type: 'string',
      example: 'John Doe',
      description: '',
    })
  })

  it('removes required array when empty', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.required).toBeUndefined()
  })

  it('handles empty formdata array', () => {
    const formdata: FormParameter[] = []

    const result = processFormDataSchema(formdata)

    expect(result).toEqual({
      type: 'object',
      properties: {},
    })
    expect(result.required).toBeUndefined()
  })

  it('adds x-scalar-disabled extension for disabled formdata parameters', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        disabled: true,
      },
      {
        key: 'email',
        value: 'john@example.com',
        type: 'text',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name?.['x-scalar-disabled']).toBe(true)
    expect(result.properties?.email?.['x-scalar-disabled']).toBeUndefined()
  })

  it('includes disabled formdata parameters in schema properties', () => {
    const formdata: FormParameter[] = [
      {
        key: 'disabledField',
        value: 'value',
        type: 'text',
        disabled: true,
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.disabledField).toBeDefined()
    expect(result.properties?.disabledField?.['x-scalar-disabled']).toBe(true)
    expect(result.properties?.disabledField?.type).toBe('string')
  })

  it('preserves other properties when formdata parameter is disabled', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        disabled: true,
        description: 'User full name',
      },
    ]

    const result = processFormDataSchema(formdata)

    const property = result.properties?.name
    expect(property?.['x-scalar-disabled']).toBe(true)
    expect(property?.type).toBe('string')
    expect(property?.example).toBe('John Doe')
    expect(property?.description).toBe('User full name')
  })

  it('adds x-scalar-disabled extension for disabled file type formdata parameters', () => {
    const formdata: FormParameter[] = [
      {
        key: 'document',
        type: 'file',
        src: null,
        disabled: true,
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.document?.['x-scalar-disabled']).toBe(true)
    expect(result.properties?.document?.format).toBe('binary')
  })

  it('does not add x-scalar-disabled extension when disabled is false', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
        disabled: false,
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name?.['x-scalar-disabled']).toBeUndefined()
  })

  it('does not add x-scalar-disabled extension when disabled is undefined', () => {
    const formdata: FormParameter[] = [
      {
        key: 'name',
        value: 'John Doe',
        type: 'text',
      },
    ]

    const result = processFormDataSchema(formdata)

    expect(result.properties?.name?.['x-scalar-disabled']).toBeUndefined()
  })
})

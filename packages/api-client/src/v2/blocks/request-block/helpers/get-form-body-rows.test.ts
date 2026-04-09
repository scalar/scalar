import type { ExampleObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'

import { getFormBodyRows } from './get-form-body-rows'

describe('getFormBodyRows', () => {
  it('returns empty array when example is null, undefined, or missing value', () => {
    expect(getFormBodyRows(null, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(undefined, 'multipart/form-data')).toEqual([])

    const exampleWithoutValue: ExampleObject = {}
    const exampleWithNullValue: ExampleObject = { value: null }
    const exampleWithUndefinedValue: ExampleObject = { value: undefined }
    const exampleWithFalsyValue: ExampleObject = { value: false }

    expect(getFormBodyRows(exampleWithoutValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithNullValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithUndefinedValue, 'multipart/form-data')).toEqual([])
    expect(getFormBodyRows(exampleWithFalsyValue, 'multipart/form-data')).toEqual([])
  })

  it('returns empty array when contentType is not multipart/form-data or application/x-www-form-urlencoded', () => {
    const example: ExampleObject = {
      value: {
        value: [{ name: 'test', value: 'data', isDisabled: false }],
      },
    }

    expect(getFormBodyRows(example, 'application/json')).toEqual([])
    expect(getFormBodyRows(example, 'application/xml')).toEqual([])
    expect(getFormBodyRows(example, 'text/plain')).toEqual([])
    expect(getFormBodyRows(example, 'application/octet-stream')).toEqual([])
  })

  it('returns array when example.value is already an array of form rows', () => {
    const formRows = [
      { name: 'username', value: 'john_doe', isDisabled: false },
      { name: 'email', value: 'john@example.com', isDisabled: true },
      { name: 'age', value: '30', isDisabled: false },
    ]

    const example: ExampleObject = {
      value: formRows,
    }

    const result = getFormBodyRows(example, 'multipart/form-data')
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ name: 'username', value: 'john_doe', isDisabled: false })
    expect(result[1]).toEqual({ name: 'email', value: 'john@example.com', isDisabled: true })
    expect(result[2]).toEqual({ name: 'age', value: '30', isDisabled: false })
  })

  it('converts object to array of rows when example.value.value is a plain object', () => {
    const formDataObject = {
      username: 'jane_doe',
      email: 'jane@example.com',
      age: '25',
      isActive: 'true',
    }

    const example: ExampleObject = {
      value: formDataObject,
    }

    const result = getFormBodyRows(example, 'application/x-www-form-urlencoded')
    expect(result).toHaveLength(4)
    expect(result).toEqual([
      { name: 'username', value: 'jane_doe', isDisabled: false },
      { name: 'email', value: 'jane@example.com', isDisabled: false },
      { name: 'age', value: '25', isDisabled: false },
      { name: 'isActive', value: 'true', isDisabled: false },
    ])

    // Verify it works with both form content types
    const result2 = getFormBodyRows(example, 'multipart/form-data')
    expect(result2).toHaveLength(4)
  })

  it('stringifies nested object and array property values when example.value is a plain object', () => {
    const example: ExampleObject = {
      value: {
        metadata: { role: 'admin', id: 42 },
        tags: ['a', 'b'],
        plain: 'unchanged',
      },
    }

    const result = getFormBodyRows(example, 'multipart/form-data')

    expect(result).toHaveLength(3)

    const metadata = result.find((row) => row.name === 'metadata')
    const tags = result.find((row) => row.name === 'tags')
    const plain = result.find((row) => row.name === 'plain')

    assert(metadata)
    assert(tags)
    assert(plain)

    expect(metadata.value).toBe(JSON.stringify({ role: 'admin', id: 42 }))
    expect(typeof metadata.value).toBe('string')

    expect(tags.value).toBe(JSON.stringify(['a', 'b']))
    expect(typeof tags.value).toBe('string')

    expect(plain.value).toBe('unchanged')
  })

  it('uses the file name as the string value when a plain-object field value is a File', () => {
    const file = new File([''], 'upload.png', { type: 'image/png' })
    const example: ExampleObject = {
      value: {
        avatar: file,
      },
    }

    const result = getFormBodyRows(example, 'application/x-www-form-urlencoded')

    expect(result).toHaveLength(1)
    assert(result[0])
    expect(result[0].name).toBe('avatar')
    expect(result[0].value).toBe('upload.png')
    expect(typeof result[0].value).toBe('string')
  })

  it('returns empty array for invalid data types: empty arrays, empty objects, primitives, and null', () => {
    // Empty array
    const exampleWithEmptyArray: ExampleObject = {
      value: [],
    }
    expect(getFormBodyRows(exampleWithEmptyArray, 'multipart/form-data')).toEqual([])

    // Empty object
    const exampleWithEmptyObject: ExampleObject = {
      value: {},
    }
    expect(getFormBodyRows(exampleWithEmptyObject, 'multipart/form-data')).toEqual([])

    // Non-object, non-array value (string, number, null)
    const exampleWithString: ExampleObject = {
      value: 'not an object or array',
    }
    expect(getFormBodyRows(exampleWithString, 'multipart/form-data')).toEqual([])

    const exampleWithNumber: ExampleObject = {
      value: 123,
    }
    expect(getFormBodyRows(exampleWithNumber, 'multipart/form-data')).toEqual([])

    const exampleWithNullInValue: ExampleObject = {
      value: null,
    }
    expect(getFormBodyRows(exampleWithNullInValue, 'multipart/form-data')).toEqual([])
  })

  describe('formBodySchema enrichment', () => {
    it('attaches schema, description, and isRequired when formBodySchema is an object schema with properties', () => {
      const example: ExampleObject = {
        value: [
          { name: 'status', value: 'active', isDisabled: false },
          { name: 'role', value: 'admin', isDisabled: false },
        ],
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            description: 'User account status',
          },
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest'],
            description: 'User role',
          },
        },
        required: ['status'],
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      expect(result).toHaveLength(2)
      assert(result[0])
      assert(result[1])

      expect(result[0].name).toBe('status')
      expect(result[0].value).toBe('active')
      expect(result[0].schema).toBeDefined()
      expect(result[0].schema?.enum).toEqual(['active', 'inactive', 'pending'])
      expect(result[0].description).toBe('User account status')
      expect(result[0].isRequired).toBe(true)

      expect(result[1].name).toBe('role')
      expect(result[1].value).toBe('admin')
      expect(result[1].schema).toBeDefined()
      expect(result[1].schema?.enum).toEqual(['admin', 'user', 'guest'])
      expect(result[1].description).toBe('User role')
      expect(result[1].isRequired).toBe(false)
    })

    it('does not attach schema when formBodySchema is undefined', () => {
      const example: ExampleObject = {
        value: [{ name: 'status', value: 'active', isDisabled: false }],
      }

      const result = getFormBodyRows(example, 'multipart/form-data')

      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].name).toBe('status')
      expect(result[0].value).toBe('active')
      expect(result[0].schema).toBeUndefined()
      expect(result[0].description).toBeUndefined()
      expect(result[0].isRequired).toBeUndefined()
    })

    it('does not attach schema when formBodySchema is not an object schema', () => {
      const example: ExampleObject = {
        value: [{ name: 'status', value: 'active', isDisabled: false }],
      }
      const formBodySchema: SchemaObject = {
        type: 'string',
        description: 'Not an object',
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      expect(result).toHaveLength(1)
      assert(result[0])
      expect(result[0].schema).toBeUndefined()
      expect(result[0].description).toBeUndefined()
      expect(result[0].isRequired).toBeUndefined()
    })

    it('leaves schema undefined for row names not in schema.properties', () => {
      const example: ExampleObject = {
        value: [
          { name: 'status', value: 'active', isDisabled: false },
          { name: 'extraField', value: 'foo', isDisabled: false },
        ],
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
        required: ['status'],
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      assert(result[0])
      assert(result[1])

      expect(result[0].schema).toBeDefined()
      expect(result[0].schema?.enum).toEqual(['active', 'inactive'])
      expect(result[0].isRequired).toBe(true)

      expect(result[1].schema).toBeUndefined()
      expect(result[1].description).toBeUndefined()
      expect(result[1].isRequired).toBe(false)
    })

    it('enriches rows from object value when formBodySchema is provided', () => {
      const example: ExampleObject = {
        value: {
          status: 'pending',
          role: 'user',
        },
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
            description: 'Current status',
          },
          role: {
            type: 'string',
            description: 'User role',
          },
        },
        required: ['status', 'role'],
      }

      const result = getFormBodyRows(example, 'application/x-www-form-urlencoded', formBodySchema)

      expect(result).toHaveLength(2)
      assert(result[0])
      assert(result[1])

      expect(result[0].name).toBe('status')
      expect(result[0].schema?.enum).toEqual(['active', 'inactive', 'pending'])
      expect(result[0].description).toBe('Current status')
      expect(result[0].isRequired).toBe(true)

      expect(result[1].name).toBe('role')
      expect(result[1].schema).toBeDefined()
      expect(result[1].description).toBe('User role')
      expect(result[1].isRequired).toBe(true)
    })

    it('handles empty required array', () => {
      const example: ExampleObject = {
        value: [{ name: 'optionalField', value: 'x', isDisabled: false }],
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          optionalField: { type: 'string' },
        },
        required: [],
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      assert(result[0])
      expect(result[0].isRequired).toBe(false)
    })
  })
})

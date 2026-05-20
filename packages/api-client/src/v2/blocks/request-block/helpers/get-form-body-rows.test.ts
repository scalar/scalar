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

    it('expands nested object properties into dotted rows (widget #4834 example)', () => {
      const example: ExampleObject = {
        value: {
          file: '',
          props: { name: '', description: '', created_at: null },
        },
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        required: ['file', 'props'],
        properties: {
          file: {
            description: 'File to upload',
            type: 'string',
            format: 'binary',
          },
          props: {
            type: 'object',
            required: ['name', 'description'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      expect(result.map((row) => row.name)).toEqual(['file', 'props.name', 'props.description', 'props.created_at'])
      expect(result[0]?.description).toBe('File to upload')
      expect(result[0]?.isRequired).toBe(true)
      expect(result[1]?.isRequired).toBe(true)
      expect(result[2]?.isRequired).toBe(true)
      expect(result[3]?.isRequired).toBe(false)
      expect(result[1]?.value).toBe('')
      // `created_at` is null in the example (its schema allows `null`); the row should
      // render as an empty input rather than the literal string "null".
      expect(result[3]?.value).toBe('')
      expect(result[3]?.schema).toBeDefined()
    })

    it('walks deeper than one level of nesting', () => {
      const example: ExampleObject = {
        value: { a: { b: { c: 'leaf' } } },
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          a: {
            type: 'object',
            properties: {
              b: {
                type: 'object',
                properties: {
                  c: { type: 'string' },
                },
              },
            },
          },
        },
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('a.b.c')
      expect(result[0]?.value).toBe('leaf')
    })

    it('cascades required: a leaf is required only when every ancestor is required', () => {
      const formBodySchema: SchemaObject = {
        type: 'object',
        required: [],
        properties: {
          props: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
            },
          },
        },
      }
      const example: ExampleObject = { value: { props: { name: '' } } }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)
      expect(result).toHaveLength(1)
      // `props` is not required, so `props.name` cannot be required either
      expect(result[0]?.isRequired).toBe(false)
    })

    it('keeps the leaf schema + required flag on dotted-name array rows (after edits)', () => {
      // Once the user edits any row, `example.value` is stored as a flat row array. The
      // dotted name still needs to resolve to its nested leaf in the schema so the
      // `Required` badge and per-field schema metadata survive across re-renders.
      const example: ExampleObject = {
        value: [
          { name: 'file', value: '@filename', isDisabled: false },
          { name: 'props.name', value: 'edited', isDisabled: false },
          { name: 'props.description', value: '', isDisabled: false },
          { name: 'props.created_at', value: '', isDisabled: false },
        ],
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        required: ['file', 'props'],
        properties: {
          file: { type: 'string', format: 'binary' },
          props: {
            type: 'object',
            required: ['name', 'description'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)

      expect(result.map((row) => [row.name, row.isRequired])).toEqual([
        ['file', true],
        ['props.name', true],
        ['props.description', true],
        ['props.created_at', false],
      ])
      expect(result[1]?.schema).toBeDefined()
      expect(result[2]?.schema).toBeDefined()
    })

    it('does not expand nested object properties into dotted rows for urlencoded bodies', () => {
      // Urlencoded has no spec-defined way to serialize one nested object across multiple
      // dotted-name keys (and `buildRequestBody` only regroups dotted rows for multipart),
      // so emitting `props.name`-style leaves here would round-trip into flat fields on send.
      // Stay on a single top-level row per property; the inner object is JSON-stringified
      // by the array branch when the example is saved back as a row array.
      const example: ExampleObject = {
        value: {
          token: 'abc',
          props: { name: 'Widget', description: 'A useful widget' },
        },
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          token: { type: 'string' },
          props: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      }

      const result = getFormBodyRows(example, 'application/x-www-form-urlencoded', formBodySchema)

      expect(result.map((row) => row.name)).toEqual(['token', 'props'])
      expect(result[1]?.value).toBe(JSON.stringify({ name: 'Widget', description: 'A useful widget' }))
    })

    it('preserves File values when walking nested schema', () => {
      const file = new File([''], 'avatar.png', { type: 'image/png' })
      const example: ExampleObject = {
        value: { upload: { file } },
      }
      const formBodySchema: SchemaObject = {
        type: 'object',
        properties: {
          upload: {
            type: 'object',
            properties: {
              file: { type: 'string', format: 'binary' },
            },
          },
        },
      }

      const result = getFormBodyRows(example, 'multipart/form-data', formBodySchema)
      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('upload.file')
      expect(result[0]?.value).toBe(file)
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

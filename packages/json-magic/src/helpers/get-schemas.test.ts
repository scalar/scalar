import { describe, expect, it } from 'vitest'

import { getId, getSchemas } from './get-schemas'

describe('getId', () => {
  it('should return $id when it exists and is a string', () => {
    const input = { $id: 'https://example.com/schema' }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })

  it('should return undefined when $id does not exist', () => {
    const input = { type: 'object' }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is not a string', () => {
    const input = { $id: 123 }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is null', () => {
    const input = { $id: null }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is undefined', () => {
    const input = { $id: undefined }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is a boolean', () => {
    const input = { $id: true }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is an object', () => {
    const input = { $id: { nested: 'value' } }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is an array', () => {
    const input = { $id: ['item1', 'item2'] }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is a function', () => {
    const input = { $id: () => 'test' }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('should return undefined when $id is an empty string', () => {
    const input = { $id: '' }
    const result = getId(input)
    expect(result).toBe(undefined)
  })

  it('should return string with special characters', () => {
    const input = { $id: 'https://example.com/schema#fragment?query=value' }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema#fragment?query=value')
  })

  it('should return string with unicode characters', () => {
    const input = { $id: 'https://example.com/测试/中文' }
    const result = getId(input)
    expect(result).toBe('https://example.com/测试/中文')
  })

  it('should handle object with multiple properties including $id', () => {
    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })

  it('should handle object with $id as first property', () => {
    const input = { $id: 'https://example.com/schema', other: 'value' }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })

  it('should handle object with $id as last property', () => {
    const input = { other: 'value', $id: 'https://example.com/schema' }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })

  it('should handle object with $id in the middle', () => {
    const input = {
      before: 'value',
      $id: 'https://example.com/schema',
      after: 'value',
    }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })
})

describe('getSchemas', () => {
  it('should return empty map for null input', () => {
    const result = getSchemas(null)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should return empty map for non-object input', () => {
    const result = getSchemas('string')
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should return empty map for number input', () => {
    const result = getSchemas(123)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should return empty map for boolean input', () => {
    const result = getSchemas(true)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should return empty map for empty object', () => {
    const result = getSchemas({})
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should extract schema with $id property', () => {
    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toEqual(input)
  })

  it('should extract schema with $anchor property', () => {
    const input = {
      $anchor: 'mySchema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('#mySchema')).toEqual(input)
  })

  it('should extract schema with $anchor property using custom base', () => {
    const input = {
      $anchor: 'mySchema',
      type: 'object',
    }

    const result = getSchemas(input, 'https://example.com/base')
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/base#mySchema')).toEqual(input)
  })

  it('should extract schema with both $id and $anchor properties', () => {
    const input = {
      $id: 'https://example.com/schema',
      $anchor: 'mySchema',
      type: 'object',
    }

    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/schema')).toEqual(input)
    expect(result.get('https://example.com/schema#mySchema')).toEqual(input)
  })

  it('should recursively traverse nested objects', () => {
    const input = {
      $id: 'https://example.com/root',
      type: 'object',
      properties: {
        nested: {
          $id: 'https://example.com/nested',
          type: 'object',
          properties: {
            deeplyNested: {
              $anchor: 'deepSchema',
              type: 'string',
            },
          },
        },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(3)
    expect(result.get('https://example.com/root')).toEqual(input)
    expect(result.get('https://example.com/nested')).toEqual(input.properties.nested)
    expect(result.get('https://example.com/nested#deepSchema')).toEqual(input.properties.nested.properties.deeplyNested)
  })

  it('should handle arrays with nested objects', () => {
    const input = {
      $id: 'https://example.com/root',
      type: 'array',
      items: [
        {
          $id: 'https://example.com/item1',
          type: 'object',
        },
        {
          $anchor: 'item2',
          type: 'string',
        },
      ],
    }

    const result = getSchemas(input)
    expect(result.size).toBe(3)
    expect(result.get('https://example.com/root')).toEqual(input)
    expect(result.get('https://example.com/item1')).toEqual(input.items[0])
    expect(result.get('https://example.com/root#item2')).toEqual(input.items[1])
  })

  it('should handle complex nested structure with multiple schemas', () => {
    const input = {
      $id: 'https://example.com/api',
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            $id: 'https://example.com/user',
            $anchor: 'userSchema',
            type: 'object',
            properties: {
              id: { type: 'integer' },
              profile: {
                $anchor: 'profile',
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
            },
          },
          Product: {
            $anchor: 'product',
            type: 'object',
            properties: {
              id: { type: 'integer' },
            },
          },
        },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(5)

    // Root schema
    expect(result.get('https://example.com/api')).toEqual(input)

    // User schema with both $id and $anchor
    expect(result.get('https://example.com/user')).toEqual(input.components.schemas.User)
    expect(result.get('https://example.com/user#userSchema')).toEqual(input.components.schemas.User)

    // Profile anchor (should use User's $id as base)
    expect(result.get('https://example.com/user#profile')).toEqual(input.components.schemas.User.properties.profile)

    // Product anchor (should use root $id as base)
    expect(result.get('https://example.com/api#product')).toEqual(input.components.schemas.Product)
  })

  it('should use custom map parameter', () => {
    const customMap = new Map<string, unknown>()
    customMap.set('existing', 'value')

    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
    }

    const result = getSchemas(input, '', customMap)
    expect(result).toBe(customMap)
    expect(result.size).toBe(2)
    expect(result.get('existing')).toBe('value')
    expect(result.get('https://example.com/schema')).toEqual(input)
  })

  it('should handle $id with non-string value', () => {
    const input = {
      $id: 123, // non-string $id should be ignored
      $anchor: 'mySchema',
      type: 'object',
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('#mySchema')).toEqual(input)
  })

  it('should handle $anchor with non-string value', () => {
    const input = {
      $id: 'https://example.com/schema',
      $anchor: 456, // non-string $anchor should be ignored
      type: 'object',
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toEqual(input)
  })

  it('should handle empty $id string', () => {
    const input = {
      $id: '',
      $anchor: 'mySchema',
      type: 'object',
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('#mySchema')).toEqual(input)
  })

  it('should handle empty $anchor string', () => {
    const input = {
      $id: 'https://example.com/schema',
      $anchor: '',
      type: 'object',
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toEqual(input)
  })

  it('should handle nested objects without $id or $anchor', () => {
    const input = {
      $id: 'https://example.com/root',
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            deeplyNested: {
              type: 'string',
            },
          },
        },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/root')).toEqual(input)
  })

  it('should handle circular references gracefully', () => {
    const input: any = {
      $id: 'https://example.com/root',
      type: 'object',
      properties: {
        self: null,
      },
    }

    // Create circular reference
    input.properties.self = input

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/root')).toEqual(input)
  })

  it('should handle mixed data types in nested structures', () => {
    const input = {
      $id: 'https://example.com/root',
      type: 'object',
      properties: {
        string: 'value',
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: {
          $anchor: 'nested',
          type: 'object',
        },
      },
    }

    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/root')).toEqual(input)
    expect(result.get('https://example.com/root#nested')).toEqual(input.properties.object)
  })
})

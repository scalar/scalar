import { describe, expect, it } from 'vitest'

import { getId, getSchemas } from './get-schemas'

describe('getId', () => {
  it('returns the $id string when present', () => {
    const input = { $id: 'https://example.com/schema' }
    const result = getId(input)
    expect(result).toBe('https://example.com/schema')
  })

  it('returns undefined when $id is not present', () => {
    const input = { name: 'test' }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is not a string', () => {
    const input = { $id: 123 }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is null', () => {
    const input = { $id: null }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is an object', () => {
    const input = { $id: { nested: 'value' } }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is an array', () => {
    const input = { $id: ['item1', 'item2'] }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is a boolean', () => {
    const input = { $id: true }
    const result = getId(input)
    expect(result).toBeUndefined()
  })

  it('returns undefined when $id is an empty string', () => {
    const input = { $id: '' }
    const result = getId(input)
    expect(result).toBe(undefined)
  })
})

describe('getSchemas', () => {
  it('returns empty map for non-object input', () => {
    const result = getSchemas('string')
    expect(result.size).toBe(0)
  })

  it('returns empty map for null input', () => {
    const result = getSchemas(null)
    expect(result.size).toBe(0)
  })

  it('returns empty map for undefined input', () => {
    const result = getSchemas(undefined)
    expect(result.size).toBe(0)
  })

  it('returns empty map for number input', () => {
    const result = getSchemas(42)
    expect(result.size).toBe(0)
  })

  it('returns empty map for boolean input', () => {
    const result = getSchemas(true)
    expect(result.size).toBe(0)
  })

  it('returns empty map for array input', () => {
    const result = getSchemas([1, 2, 3])
    expect(result.size).toBe(0)
  })

  it('collects schema with $id', () => {
    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
    }
    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toBe('')
  })

  it('collects schema with $anchor', () => {
    const input = {
      $anchor: 'myAnchor',
      type: 'string',
    }
    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('#myAnchor')).toBe('')
  })

  it('collects schema with both $id and $anchor', () => {
    const input = {
      $id: 'https://example.com/schema',
      $anchor: 'myAnchor',
      type: 'object',
    }
    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/schema')).toBe('')
    expect(result.get('https://example.com/schema#myAnchor')).toBe('')
  })

  it('collects nested schemas with $id', () => {
    const input = {
      definitions: {
        user: {
          $id: 'https://example.com/user',
          type: 'object',
        },
        product: {
          $id: 'https://example.com/product',
          type: 'object',
        },
      },
    }
    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/user')).toBe('definitions/user')
    expect(result.get('https://example.com/product')).toBe('definitions/product')
  })

  it('collects nested schemas with $anchor', () => {
    const input = {
      definitions: {
        user: {
          $anchor: 'user',
          type: 'object',
        },
        product: {
          $anchor: 'product',
          type: 'object',
        },
      },
    }
    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('#user')).toBe('definitions/user')
    expect(result.get('#product')).toBe('definitions/product')
  })

  it('uses parent $id as base for nested $anchor', () => {
    const input = {
      $id: 'https://example.com/schema',
      definitions: {
        user: {
          $anchor: 'user',
          type: 'object',
        },
      },
    }
    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/schema')).toBe('')
    expect(result.get('https://example.com/schema#user')).toBe('definitions/user')
  })

  it('handles deeply nested schemas', () => {
    const input = {
      components: {
        schemas: {
          user: {
            $id: 'https://example.com/user',
            properties: {
              address: {
                $anchor: 'address',
                type: 'object',
              },
            },
          },
        },
      },
    }
    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/user')).toBe('components/schemas/user')
    expect(result.get('https://example.com/user#address')).toBe('components/schemas/user/properties/address')
  })

  it('handles circular references without infinite loops', () => {
    const input: any = {
      $id: 'https://example.com/schema',
      type: 'object',
    }
    input.self = input // Create circular reference

    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toBe('')
  })

  it('handles multiple circular references', () => {
    const input: any = {
      $id: 'https://example.com/schema',
      type: 'object',
      properties: {
        user: {
          $anchor: 'user',
          type: 'object',
        },
      },
    }
    input.self = input
    input.properties.user.self = input

    const result = getSchemas(input)
    expect(result.size).toBe(2)
    expect(result.get('https://example.com/schema')).toBe('')
    expect(result.get('https://example.com/schema#user')).toBe('properties/user')
  })

  it('ignores non-string $id values', () => {
    const input = {
      $id: 123,
      type: 'object',
    }
    const result = getSchemas(input)
    expect(result.size).toBe(0)
  })

  it('ignores non-string $anchor values', () => {
    const input = {
      $anchor: 123,
      type: 'object',
    }
    const result = getSchemas(input)
    expect(result.size).toBe(0)
  })

  it('handles empty objects', () => {
    const input = {}
    const result = getSchemas(input)
    expect(result.size).toBe(0)
  })

  it('handles objects with only primitive values', () => {
    const input = {
      name: 'test',
      age: 25,
      active: true,
      tags: ['tag1', 'tag2'],
    }
    const result = getSchemas(input)
    expect(result.size).toBe(0)
  })

  it('handles mixed primitive and object values', () => {
    const input = {
      name: 'test',
      schema: {
        $id: 'https://example.com/schema',
        type: 'object',
      },
      age: 25,
    }
    const result = getSchemas(input)
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toBe('schema')
  })

  it('preserves custom base parameter', () => {
    const input = {
      $anchor: 'myAnchor',
      type: 'object',
    }
    const result = getSchemas(input, 'https://custom.com/base')
    expect(result.size).toBe(1)
    expect(result.get('https://custom.com/base#myAnchor')).toBe('')
  })

  it('preserves custom segments parameter', () => {
    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
    }
    const result = getSchemas(input, '', ['custom', 'path'])
    expect(result.size).toBe(1)
    expect(result.get('https://example.com/schema')).toBe('custom/path')
  })

  it('reuses existing map when provided', () => {
    const existingMap = new Map([['existing', 'path']])
    const input = {
      $id: 'https://example.com/schema',
      type: 'object',
    }
    const result = getSchemas(input, '', [], existingMap)
    expect(result).toBe(existingMap)
    expect(result.size).toBe(2)
    expect(result.get('existing')).toBe('path')
    expect(result.get('https://example.com/schema')).toBe('')
  })

  it('handles complex nested structure with multiple schemas', () => {
    const input = {
      $id: 'https://example.com/root',
      openapi: '3.0.0',
      info: {
        title: 'API',
      },
      components: {
        schemas: {
          user: {
            $id: 'https://example.com/user',
            $anchor: 'user',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              address: {
                $anchor: 'address',
                type: 'object',
                properties: {
                  street: {
                    type: 'string',
                  },
                },
              },
            },
          },
          product: {
            $anchor: 'product',
            type: 'object',
            properties: {
              id: {
                type: 'integer',
              },
            },
          },
        },
      },
    }
    const result = getSchemas(input)
    expect(result.size).toBe(5)
    expect(result.get('https://example.com/root')).toBe('')
    expect(result.get('https://example.com/user')).toBe('components/schemas/user')
    expect(result.get('https://example.com/user#user')).toBe('components/schemas/user')
    expect(result.get('https://example.com/user#address')).toBe('components/schemas/user/properties/address')
    expect(result.get('https://example.com/root#product')).toBe('components/schemas/product')
  })
})

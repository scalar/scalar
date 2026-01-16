import { describe, expect, it } from 'vitest'

import type { UnknownObject } from '@/helpers/general'

import { getResolvedRef } from './helpers'

describe('getResolvedRef', () => {
  it('returns the original node when it is not a $ref', () => {
    const node = { name: 'User', type: 'object' }
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBe(node)
  })

  it('resolves a simple local $ref', () => {
    const rootNode: UnknownObject = {
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const node = { $ref: '#/components/schemas/User' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
  })

  it('recursively resolves nested $refs', () => {
    const rootNode: UnknownObject = {
      components: {
        schemas: {
          User: { $ref: '#/components/schemas/Person' },
          Person: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const node = { $ref: '#/components/schemas/User' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
  })

  it('resolves deeply nested $refs', () => {
    const rootNode: UnknownObject = {
      components: {
        schemas: {
          A: { $ref: '#/components/schemas/B' },
          B: { $ref: '#/components/schemas/C' },
          C: { $ref: '#/components/schemas/D' },
          D: {
            type: 'string',
          },
        },
      },
    }

    const node = { $ref: '#/components/schemas/A' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toEqual({ type: 'string' })
  })

  it('returns node for external $refs', () => {
    const rootNode: UnknownObject = {}
    const node = { $ref: 'https://example.com/schemas/User' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBe(node)
  })

  it('returns node for relative file $refs', () => {
    const rootNode: UnknownObject = {}
    const node = { $ref: './schemas/User.json' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBe(node)
  })

  it('returns node for absolute file $refs', () => {
    const rootNode: UnknownObject = {}
    const node = { $ref: '/schemas/User.json' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBe(node)
  })

  it('returns undefined when $ref path does not exist', () => {
    const rootNode: UnknownObject = {
      components: {
        schemas: {},
      },
    }

    const node = { $ref: '#/components/schemas/NonExistent' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBeUndefined()
  })

  it('returns undefined when $ref path is partially invalid', () => {
    const rootNode: UnknownObject = {
      components: {},
    }

    const node = { $ref: '#/components/schemas/User' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBeUndefined()
  })

  it('handles primitives', () => {
    const node = 'hello'
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBe('hello')
  })

  it('handles numbers', () => {
    const node = 42
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBe(42)
  })

  it('handles booleans', () => {
    const node = true
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBe(true)
  })

  it('handles null', () => {
    const node = null
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBeNull()
  })

  it('handles undefined', () => {
    const node = undefined
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toBeUndefined()
  })

  it('handles arrays', () => {
    const node = [1, 2, 3]
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toEqual([1, 2, 3])
  })

  it('handles objects with $ref but non-string value', () => {
    const node = { $ref: 123 }
    const context = { rootNode: {} }

    const result = getResolvedRef(node, context)

    expect(result).toEqual({ $ref: 123 })
  })

  it('handles objects with $ref but empty string', () => {
    const rootNode: UnknownObject = {}
    const node = { $ref: '' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBe(node)
  })

  it('handles $ref with only hash symbol', () => {
    const rootNode: UnknownObject = {
      name: 'root',
    }
    const node = { $ref: '#' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    expect(result).toBe(rootNode)
  })

  it('handles $ref pointing to root', () => {
    const rootNode: UnknownObject = {
      openapi: '3.1.0',
      info: {
        title: 'API',
      },
    }
    const node = { $ref: '#/' }
    const context = { rootNode }

    const result = getResolvedRef(node, context)

    // When $ref is '#/', after slice(2) we get '', which splits to ['']
    // Looking up rootNode[''] returns undefined
    expect(result).toBeUndefined()
  })
})

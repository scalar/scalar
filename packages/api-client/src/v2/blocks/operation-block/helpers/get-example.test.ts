import { describe, expect, it } from 'vitest'

import { getExample } from './get-example'

describe('get-example', () => {
  it('returns example from content-based parameter', () => {
    const param = {
      name: 'filter',
      in: 'query' as const,
      content: {
        'application/json': {
          examples: {
            default: { value: { status: 'active' } },
          },
        },
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: { status: 'active' } })
  })

  it('returns example from schema-based parameter with examples property', () => {
    const param = {
      name: 'userId',
      in: 'path' as const,
      examples: {
        admin: { value: 'admin-123' },
        user: { value: 'user-456' },
      },
    }

    const result = getExample(param, 'admin', 'application/json')

    expect(result).toEqual({ value: 'admin-123' })
  })

  it('returns undefined when parameter has neither content nor examples', () => {
    const param = {
      name: 'limit',
      in: 'query' as const,
      schema: { type: 'integer' as const },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toBeUndefined()
  })

  it('returns undefined when exampleKey does not exist', () => {
    const param = {
      name: 'status',
      in: 'query' as const,
      examples: {
        active: { value: 'active' },
      },
    }

    const result = getExample(param, 'nonexistent', 'application/json')

    expect(result).toBeUndefined()
  })

  it('resolves $ref values when example is a reference', () => {
    const param = {
      name: 'data',
      in: 'query' as const,
      examples: {
        sample: {
          '$ref': '#/components/examples/SampleData',
          '$ref-value': { value: 'resolved-example-data' },
        },
      },
    }

    const result = getExample(param, 'sample', 'application/json')

    expect(result).toEqual({ value: 'resolved-example-data' })
  })

  it('falls back to schema default when exampleKey does not exist', () => {
    const param = {
      name: 'limit',
      in: 'query' as const,
      examples: {
        large: { value: 100 },
      },
      schema: {
        type: 'integer' as const,
        default: 10,
      },
    }

    const result = getExample(param, 'nonexistent', 'application/json')

    expect(result).toEqual({ value: 10 })
  })

  it('returns schema default value for string type', () => {
    const param = {
      name: 'sort',
      in: 'query' as const,
      examples: {},
      schema: {
        type: 'string' as const,
        default: 'createdAt',
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: 'createdAt' })
  })

  it('returns schema default value for boolean type', () => {
    const param = {
      name: 'includeArchived',
      in: 'query' as const,
      examples: {},
      schema: {
        type: 'boolean' as const,
        default: false,
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: false })
  })

  it('returns schema default value when default is 0', () => {
    const param = {
      name: 'offset',
      in: 'query' as const,
      examples: {},
      schema: {
        type: 'integer' as const,
        default: 0,
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: 0 })
  })

  it('returns schema default value when default is empty string', () => {
    const param = {
      name: 'search',
      in: 'query' as const,
      examples: {},
      schema: {
        type: 'string' as const,
        default: '',
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: '' })
  })

  it('returns schema default value for object type', () => {
    const param = {
      name: 'filter',
      in: 'query' as const,
      examples: {},
      schema: {
        type: 'object' as const,
        default: { status: 'active', limit: 20 },
      },
    }

    const result = getExample(param, 'default', 'application/json')

    expect(result).toEqual({ value: { status: 'active', limit: 20 } })
  })

  it('returns undefined when schema has no default and no matching example', () => {
    const param = {
      name: 'page',
      in: 'query' as const,
      examples: {
        first: { value: 1 },
      },
      schema: {
        type: 'integer' as const,
      },
    }

    const result = getExample(param, 'nonexistent', 'application/json')

    expect(result).toBeUndefined()
  })
})

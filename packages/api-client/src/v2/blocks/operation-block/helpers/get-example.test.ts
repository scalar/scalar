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
})

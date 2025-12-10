import { describe, expect, it, vi } from 'vitest'

import { getExampleFromBody } from './get-request-body-example'

// Mock the dependencies
vi.mock('@scalar/workspace-store/helpers/get-resolved-ref', () => ({
  getResolvedRef: vi.fn((node) => {
    // Simulate $ref resolution - return the $ref-value if it's a ref, otherwise return as-is
    if (typeof node === 'object' && node !== null && '$ref' in node) {
      return node['$ref-value']
    }
    return node
  }),
}))

vi.mock('@/v2/blocks/operation-code-sample/helpers/get-example-from-schema', () => ({
  getExampleFromSchema: vi.fn((schema) => {
    // Return a predictable example based on the schema
    if (schema?.type === 'object') {
      return { id: 1, name: 'example' }
    }
    if (schema?.type === 'string') {
      return 'example-string'
    }
    return null
  }),
}))

describe('get-request-body-example', () => {
  it('returns existing example when found in content.examples', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            myExample: {
              value: { id: 123, name: 'Test User' },
            },
          },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'myExample')

    expect(result).toEqual({ value: { id: 123, name: 'Test User' } })
  })

  it('generates example from schema when no example exists', () => {
    const requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    expect(result).toEqual({ value: { id: 1, name: 'example' } })
  })

  it('returns null when content for contentType does not exist', () => {
    const requestBody = {
      content: {
        'application/xml': {
          schema: { type: 'object' },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    expect(result).toBeNull()
  })

  it('returns null when neither example nor schema exists', () => {
    const requestBody = {
      content: {
        'application/json': {},
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    expect(result).toBeNull()
  })

  it('resolves $ref examples correctly', () => {
    const requestBody = {
      content: {
        'application/json': {
          examples: {
            refExample: {
              $ref: '#/components/examples/UserExample',
              '$ref-value': {
                value: { id: 456, email: 'ref@example.com' },
              },
            },
          },
        },
      },
    }

    const result = getExampleFromBody(requestBody, 'application/json', 'refExample')

    expect(result).toEqual({ value: { id: 456, email: 'ref@example.com' } })
  })
})

import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getExampleFromBody } from './get-request-body-example'

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
    } satisfies RequestBodyObject

    const result = getExampleFromBody(requestBody, 'application/json', 'default')
    expect(result).toEqual({ value: { id: 1, name: '' } })
  })

  it('returns null when content for contentType does not exist', () => {
    const requestBody = {
      content: {
        'application/xml': {
          schema: { type: 'object' },
        },
      },
    } satisfies RequestBodyObject

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

  it('filters out readOnly properties when generating example from schema', () => {
    const requestBody = {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              createdAt: { type: 'string', readOnly: true },
              updatedAt: { type: 'string', readOnly: true },
            },
          },
        },
      },
    } satisfies RequestBodyObject

    const result = getExampleFromBody(requestBody, 'application/json', 'default')

    // readOnly properties should be filtered out
    expect(result).toEqual({ value: { id: 1, name: '' } })
    expect(result?.value).not.toHaveProperty('createdAt')
    expect(result?.value).not.toHaveProperty('updatedAt')
  })
})

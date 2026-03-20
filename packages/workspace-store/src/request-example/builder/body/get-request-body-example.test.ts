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

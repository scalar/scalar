import { describe, expect, it } from 'vitest'

import type { Item, Response } from '@/types'

import { extractResponses } from './responses'

describe('responses', () => {
  it('extracts responses with status codes', () => {
    const responses: Response[] = [
      {
        code: 200,
        status: 'OK',
        body: '{"message": "Success"}',
      },
      {
        code: 404,
        status: 'Not Found',
        body: '{"error": "Not found"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result).toBeDefined()
    expect(result?.['200']).toBeDefined()
    expect(result?.['404']).toBeDefined()
    expect(result?.['200']?.description).toBe('OK')
    expect(result?.['404']?.description).toBe('Not Found')
  })

  it('uses default description when status is missing', () => {
    const responses: Response[] = [
      {
        code: 200,
        body: '{"message": "Success"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.description).toBe('Successful response')
  })

  it('infers schema from JSON body', () => {
    const responses: Response[] = [
      {
        code: 200,
        body: '{"id": 1, "name": "John"}',
      },
    ]

    const result = extractResponses(responses)

    // The function infers schema from the string itself, not parsed JSON
    expect(result?.['200']?.content?.['application/json']?.schema).toEqual({
      type: 'string',
    })
  })

  it('includes example from body', () => {
    const responses: Response[] = [
      {
        code: 200,
        body: '{"id": 1, "name": "John"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.content?.['application/json']?.examples?.default).toEqual({
      id: 1,
      name: 'John',
    })
  })

  it('handles invalid JSON body', () => {
    const responses: Response[] = [
      {
        code: 200,
        body: 'invalid json',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.content?.['application/json']?.examples?.default).toEqual({
      rawContent: 'invalid json',
    })
  })

  it('extracts headers from response', () => {
    const responses: Response[] = [
      {
        code: 200,
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'X-RateLimit-Limit',
            value: '100',
          },
        ],
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.headers).toEqual({
      'Content-Type': {
        schema: {
          type: 'string',
          examples: ['application/json'],
        },
      },
      'X-RateLimit-Limit': {
        schema: {
          type: 'string',
          examples: ['100'],
        },
      },
    })
  })

  it('handles string header format', () => {
    const responses: Response[] = [
      {
        code: 200,
        header: 'Content-Type: application/json',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.headers).toBeUndefined()
  })

  it('handles null headers', () => {
    const responses: Response[] = [
      {
        code: 200,
        header: null,
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['200']?.headers).toBeUndefined()
  })

  it('adds status codes from test scripts', () => {
    const responses: Response[] = []
    const item: Item = {
      name: 'Get User',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(201);'],
          },
        },
      ],
    }

    const result = extractResponses(responses, item)

    expect(result?.['201']).toBeDefined()
    expect(result?.['201']?.description).toBe('Successful response')
  })

  it('does not override existing response when adding from tests', () => {
    const responses: Response[] = [
      {
        code: 201,
        status: 'Created',
        body: '{"id": 1}',
      },
    ]
    const item: Item = {
      name: 'Create User',
      request: {
        method: 'POST',
        url: {
          raw: 'https://example.com/users',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(201);'],
          },
        },
      ],
    }

    const result = extractResponses(responses, item)

    expect(result?.['201']?.description).toBe('Created')
    expect(result?.['201']?.content).toBeDefined()
  })

  it('handles default status code', () => {
    const responses: Response[] = [
      {
        code: undefined,
        status: 'Error',
        body: '{"error": "Something went wrong"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['default']).toBeDefined()
    expect(result?.['default']?.description).toBe('Error')
  })

  it('returns undefined when no responses are present', () => {
    const responses: Response[] = []

    const result = extractResponses(responses)

    expect(result).toBeUndefined()
  })

  it('handles empty body', () => {
    const responses: Response[] = [
      {
        code: 204,
        status: 'No Content',
        body: null,
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['204']?.content?.['application/json']?.examples?.default).toEqual({
      rawContent: '',
    })
  })

  it('handles array response body', () => {
    const responses: Response[] = [
      {
        code: 200,
        body: '[{"id": 1}, {"id": 2}]',
      },
    ]

    const result = extractResponses(responses)

    // The function infers schema from the string itself, not parsed JSON
    expect(result?.['200']?.content?.['application/json']?.schema).toEqual({
      type: 'string',
    })
  })
})

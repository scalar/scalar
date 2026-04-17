import { describe, expect, it, vi } from 'vitest'

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

    expect(result?.['200']?.description).toBe('OK')
  })

  it('uses status-aware default description when status is missing for error responses', () => {
    const responses: Response[] = [
      {
        code: 404,
        body: '{"error": "Language not found"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['404']?.description).toBe('Not found')
  })

  it('uses default fallback description for unknown status codes', () => {
    const responses: Response[] = [
      {
        code: 418,
        body: '{"message": "I am a teapot"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['418']?.description).toBe('Default response')
  })

  it('prefers response name description when using "<code> - <description>" format', () => {
    const responses: Response[] = [
      {
        name: '404 - Language not found',
        code: 404,
        status: 'Not Found',
        body: '{"error": "Language not found"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['404']?.description).toBe('Language not found')
  })

  it('does not use response name description when code does not match', () => {
    const responses: Response[] = [
      {
        name: '404 - Language not found',
        code: 401,
        status: 'Unauthorized',
        body: '{"error": "Unauthorized"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['401']?.description).toBe('Unauthorized')
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
    expect(result?.['201']?.description).toBe('Created')
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

    expect(result?.['204']?.content).toBeUndefined()
  })

  it('omits content for no-body status codes without body examples', () => {
    const responses: Response[] = [
      {
        code: 101,
        status: 'Switching Protocols',
      },
      {
        code: 205,
        status: 'Reset Content',
      },
      {
        code: 304,
        status: 'Not Modified',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['101']?.content).toBeUndefined()
    expect(result?.['205']?.content).toBeUndefined()
    expect(result?.['304']?.content).toBeUndefined()
  })

  it('omits content for no-body status codes extracted from test scripts', () => {
    const responses: Response[] = []
    const item: Item = {
      name: 'No Body Status',
      request: {
        method: 'GET',
        url: {
          raw: 'https://example.com/resource',
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: ['pm.response.to.have.status(204);', 'pm.response.to.have.status(304);'],
          },
        },
      ],
    }

    const result = extractResponses(responses, item)

    expect(result?.['204']?.content).toBeUndefined()
    expect(result?.['304']?.content).toBeUndefined()
  })

  it('keeps content and logs warning when no-body status code has explicit body example', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const responses: Response[] = [
      {
        code: 204,
        status: 'No Content',
        body: '{"message": "actually has content"}',
      },
    ]

    const result = extractResponses(responses)

    expect(result?.['204']?.content?.['application/json']?.examples?.default).toStrictEqual({
      message: 'actually has content',
    })
    expect(warnSpy).toHaveBeenCalledWith(
      '[postman-to-openapi] Response 204 usually has no body, but Postman includes a body example. Keeping OpenAPI content.',
    )

    warnSpy.mockRestore()
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

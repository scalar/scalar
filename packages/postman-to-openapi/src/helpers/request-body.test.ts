import { describe, expect, it } from 'vitest'

import type { RequestBody } from '@/types'

import { extractRequestBody } from './request-body'

describe('request-body', () => {
  it('extracts raw JSON body', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{"name": "John", "age": 30}',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            example: {
              name: 'John',
              age: 30,
            },
          },
        },
      },
    })
  })

  it('handles invalid JSON as text/plain', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: 'invalid json {',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            examples: ['invalid json {'],
          },
        },
      },
    })
  })

  it('handles empty raw body', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            examples: undefined,
          },
        },
      },
    })
  })

  it('extracts form-data body', () => {
    const body: RequestBody = {
      mode: 'formdata',
      formdata: [
        {
          key: 'name',
          value: 'John',
          type: 'text',
        },
        {
          key: 'file',
          type: 'file',
          src: null,
        },
      ],
    }

    const result = extractRequestBody(body)

    expect(result.content?.['multipart/form-data']).toBeDefined()
    expect(result.content?.['multipart/form-data']?.schema).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    })
  })

  it('extracts urlencoded body', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      urlencoded: [
        {
          key: 'name',
          value: 'John',
        },
        {
          key: 'email',
          value: 'john@example.com',
        },
      ],
    }

    const result = extractRequestBody(body)

    expect(result.content?.['application/x-www-form-urlencoded']).toBeDefined()
    expect(result.content?.['application/x-www-form-urlencoded']?.schema).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          examples: ['John'],
        },
        email: {
          type: 'string',
          examples: ['john@example.com'],
        },
      },
      required: [],
    })
  })

  it('handles urlencoded body with required fields', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      urlencoded: [
        {
          key: 'name',
          value: 'John',
          description: 'User name [required]',
        },
        {
          key: 'email',
          value: 'john@example.com',
        },
      ],
    }

    const result = extractRequestBody(body)

    expect(result.content?.['application/x-www-form-urlencoded']?.schema?.required).toEqual(['name'])
  })

  it('returns empty content for unsupported mode', () => {
    const body: RequestBody = {
      mode: 'file',
      file: {
        src: null,
      },
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {},
    })
  })

  it('handles formdata mode without formdata array', () => {
    const body: RequestBody = {
      mode: 'formdata',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {},
    })
  })

  it('handles urlencoded mode without urlencoded array', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {},
    })
  })

  it('handles complex nested JSON', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: JSON.stringify({
        user: {
          name: 'John',
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
        tags: ['admin', 'user'],
      }),
    }

    const result = extractRequestBody(body)

    expect(result.content?.['application/json']?.schema?.example).toEqual({
      user: {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
      tags: ['admin', 'user'],
    })
  })

  it('creates JSON schema placeholder when body has variables with JSON language', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{{bodyData}}',
      options: {
        raw: {
          language: 'json',
        },
      },
    }

    const result = extractRequestBody(body)

    expect(result.content?.['application/json']).toBeDefined()
    expect(result.content?.['application/json']?.schema?.type).toBe('object')
    expect(result.content?.['application/json']?.schema?.description).toBe('Body data set via pre-request script')
  })

  it('handles body with variables but non-JSON language', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{{bodyData}}',
      options: {
        raw: {
          language: 'text',
        },
      },
    }

    const result = extractRequestBody(body)

    expect(result.content?.['text/plain']).toBeDefined()
  })

  it('adds x-scalar-disabled extension for disabled urlencoded parameters', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      urlencoded: [
        {
          key: 'name',
          value: 'John',
          disabled: true,
        },
        {
          key: 'email',
          value: 'john@example.com',
        },
      ],
    }

    const result = extractRequestBody(body)

    const schema = result.content?.['application/x-www-form-urlencoded']?.schema
    expect(schema?.properties?.name?.['x-scalar-disabled']).toBe(true)
    expect(schema?.properties?.email?.['x-scalar-disabled']).toBeUndefined()
  })

  it('includes disabled urlencoded parameters in schema properties', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      urlencoded: [
        {
          key: 'disabledField',
          value: 'value',
          disabled: true,
        },
      ],
    }

    const result = extractRequestBody(body)

    const schema = result.content?.['application/x-www-form-urlencoded']?.schema
    expect(schema?.properties?.disabledField).toBeDefined()
    expect(schema?.properties?.disabledField?.['x-scalar-disabled']).toBe(true)
    expect(schema?.properties?.disabledField?.type).toBe('string')
  })

  it('preserves other properties when urlencoded parameter is disabled', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
      urlencoded: [
        {
          key: 'name',
          value: 'John',
          disabled: true,
          description: 'User name',
        },
      ],
    }

    const result = extractRequestBody(body)

    const schema = result.content?.['application/x-www-form-urlencoded']?.schema
    const property = schema?.properties?.name
    expect(property?.['x-scalar-disabled']).toBe(true)
    expect(property?.type).toBe('string')
    expect(property?.examples).toEqual(['John'])
    expect(property?.description).toBe('User name')
  })

  it('handles JSON null as valid JSON body', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: 'null',
    }

    const result = extractRequestBody(body)

    expect(result).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            example: null,
          },
        },
      },
    })
  })
})

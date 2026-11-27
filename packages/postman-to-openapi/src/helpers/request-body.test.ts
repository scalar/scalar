import { describe, expect, it } from 'vitest'

import type { RequestBody } from '@/types'

import { extractRequestBody } from './request-body'

describe('request-body', () => {
  it('extracts raw JSON body when language is json', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{"name": "John", "age": 30}',
      options: {
        raw: {
          language: 'json',
        },
      },
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
          examples: {
            default: {
              value: '{"name": "John", "age": 30}',
            },
          },
        },
      },
    })
  })

  it('treats raw JSON as text/plain when language is not set', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{"name": "John", "age": 30}',
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            examples: ['{"name": "John", "age": 30}'],
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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

    expect(result.content?.['application/x-www-form-urlencoded']?.schema?.required).toEqual(['name'])
  })

  it.each([
    ['formdata', 'multipart/form-data'],
    ['urlencoded', 'application/x-www-form-urlencoded'],
  ] as const)('writes %s rows as named form rows in their original order', (mode, mediaType) => {
    const rows = [
      { key: 'tag', value: 'a', type: 'text' as const },
      { key: 'username', value: 'kunal', type: 'text' as const },
      { key: 'tag', value: 'b', type: 'text' as const, disabled: true },
      { key: 'tag', value: '', type: 'text' as const },
      { key: 'note', type: 'text' as const },
    ]
    const body: RequestBody = mode === 'formdata' ? { mode, formdata: rows } : { mode, urlencoded: rows }
    const original = structuredClone(body)

    const result = extractRequestBody(body, 'default')

    expect(result.content?.[mediaType]?.examples).toStrictEqual({
      default: {
        value: [
          { name: 'tag', value: 'a', isDisabled: false },
          { name: 'username', value: 'kunal', isDisabled: false },
          { name: 'tag', value: 'b', isDisabled: true },
          { name: 'tag', value: '', isDisabled: false },
          { name: 'note', value: '', isDisabled: false },
        ],
      },
    })
    expect(body).toStrictEqual(original)
  })

  it.each([[null], ['/tmp/avatar.png'], [['/tmp/a.png', '/tmp/b.png']], [[]]])(
    'leaves form-data file rows empty when the source is %j',
    (src) => {
      const body: RequestBody = {
        mode: 'formdata',
        formdata: [
          { key: 'title', value: 'hello', type: 'text' },
          { key: 'avatar', src, type: 'file' },
        ],
      }

      const result = extractRequestBody(body, 'default')

      expect(result.content?.['multipart/form-data']?.examples).toStrictEqual({
        default: {
          value: [
            { name: 'title', value: 'hello', isDisabled: false },
            { name: 'avatar', value: '', isDisabled: false },
          ],
        },
      })
    },
  )

  it.each(['__proto__', 'constructor', 'toString', 'properties', 'required'])(
    'treats %s as an ordinary form field name',
    (key) => {
      const formdata = extractRequestBody(
        { mode: 'formdata', formdata: [{ key, value: 'x', type: 'text', description: '[required]' }] },
        'default',
      )
      const urlencoded = extractRequestBody(
        { mode: 'urlencoded', urlencoded: [{ key, value: 'x', description: '[required]' }] },
        'default',
      )

      for (const [result, mediaType] of [
        [formdata, 'multipart/form-data'],
        [urlencoded, 'application/x-www-form-urlencoded'],
      ] as const) {
        const media = result.content?.[mediaType]
        const properties = media?.schema?.properties ?? {}
        expect(Object.hasOwn(properties, key)).toBe(true)
        expect(Object.getPrototypeOf(properties)).toBe(Object.prototype)
        expect(media?.schema?.required).toStrictEqual([key])
        expect(media?.examples).toStrictEqual({ default: { value: [{ name: key, value: 'x', isDisabled: false }] } })
      }
    },
  )

  it.each([
    ['formdata', 'multipart/form-data'],
    ['urlencoded', 'application/x-www-form-urlencoded'],
  ] as const)('lists a repeated required %s field once', (mode, mediaType) => {
    const rows = [
      { key: 'tag', value: 'a', type: 'text' as const, description: 'Tag [required]' },
      { key: 'tag', value: 'b', type: 'text' as const, description: 'Tag [required]' },
    ]
    const body: RequestBody = mode === 'formdata' ? { mode, formdata: rows } : { mode, urlencoded: rows }

    const result = extractRequestBody(body, 'default')

    expect(result.content?.[mediaType]?.schema?.required).toStrictEqual(['tag'])
  })

  it('uses an empty string example for urlencoded fields without a value', () => {
    const result = extractRequestBody({ mode: 'urlencoded', urlencoded: [{ key: 'note' }] }, 'default')

    expect(result.content?.['application/x-www-form-urlencoded']?.schema?.properties?.note).toStrictEqual({
      type: 'string',
      examples: [''],
      description: undefined,
    })
  })

  it('keeps file bodies binary when no file is selected', () => {
    const body: RequestBody = {
      mode: 'file',
      file: {
        src: null,
      },
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toStrictEqual({
      content: { 'application/octet-stream': {} },
    })
  })

  it.each([undefined, 'application/octet-stream', 'image/png', 'text/plain'])(
    'uses the declared file media type %s or the binary default',
    (contentType) => {
      expect(extractRequestBody({ mode: 'file', file: { src: 'photo.png' } }, 'upload', contentType)).toStrictEqual({
        content: { [contentType ?? 'application/octet-stream']: {} },
      })
    },
  )

  it.each([
    { variables: '{"id":"1"}', expected: { id: '1' } },
    { variables: { id: '1' }, expected: { id: '1' } },
    {
      variables: '{"filter":{"ids":[1,2],"enabled":true},"cursor":null}',
      expected: { filter: { ids: [1, 2], enabled: true }, cursor: null },
    },
    { variables: { filter: { ids: [1, 2] } }, expected: { filter: { ids: [1, 2] } } },
    { variables: null, expected: null },
    { variables: 'null', expected: null },
    { variables: undefined, expected: undefined },
    { variables: '', expected: undefined },
    { variables: '  ', expected: undefined },
    { variables: '{{variables}}', expected: '{{variables}}' },
    { variables: '{invalid', expected: '{invalid' },
  ])('preserves GraphQL variables from $variables', ({ variables, expected }) => {
    const query = 'query Item($id: ID!) { item(id: $id) { id } }'
    expect(extractRequestBody({ mode: 'graphql', graphql: { query, variables } }, 'query')).toStrictEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              variables: { type: 'object' },
            },
            required: ['query'],
          },
          examples: { query: { value: { query, ...(expected !== undefined && { variables: expected }) } } },
        },
      },
    })
  })

  it('preserves an empty GraphQL query', () => {
    expect(extractRequestBody({ mode: 'graphql', graphql: { query: '' } }, 'query')).toStrictEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              variables: { type: 'object' },
            },
            required: ['query'],
          },
          examples: { query: { value: { query: '' } } },
        },
      },
    })
  })

  it('handles formdata mode without formdata array', () => {
    const body: RequestBody = {
      mode: 'formdata',
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {},
    })
  })

  it('handles urlencoded mode without urlencoded array', () => {
    const body: RequestBody = {
      mode: 'urlencoded',
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {},
    })
  })

  it('handles complex nested JSON when language is json', () => {
    const raw = JSON.stringify({
      user: {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      },
      tags: ['admin', 'user'],
    })

    const body: RequestBody = {
      mode: 'raw',
      raw,
      options: {
        raw: {
          language: 'json',
        },
      },
    }

    const result = extractRequestBody(body, 'default')

    expect(result.content?.['application/json']?.examples?.default?.value).toBe(raw)
  })

  it('keeps variable placeholders as raw string value when language is json', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: '{{bodyData}}',
      options: {
        raw: {
          language: 'json',
        },
      },
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
          examples: {
            default: {
              value: '{{bodyData}}',
            },
          },
        },
      },
    })
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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

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

    const result = extractRequestBody(body, 'default')

    const schema = result.content?.['application/x-www-form-urlencoded']?.schema
    const property = schema?.properties?.name
    expect(property?.['x-scalar-disabled']).toBe(true)
    expect(property?.type).toBe('string')
    expect(property?.examples).toEqual(['John'])
    expect(property?.description).toBe('User name')
  })

  it('treats literal null as text/plain when language is not json', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: 'null',
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            examples: ['null'],
          },
        },
      },
    })
  })

  it('treats literal null as application/json when language is json', () => {
    const body: RequestBody = {
      mode: 'raw',
      raw: 'null',
      options: {
        raw: {
          language: 'json',
        },
      },
    }

    const result = extractRequestBody(body, 'default')

    expect(result).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
          examples: {
            default: {
              value: 'null',
            },
          },
        },
      },
    })
  })

  describe('contentType override', () => {
    it('uses request Content-Type over language hint', () => {
      const body: RequestBody = {
        mode: 'raw',
        raw: '<user><name>John</name></user>',
        options: { raw: { language: 'json' } },
      }

      const result = extractRequestBody(body, 'default', 'application/xml')

      expect(result).toEqual({
        content: {
          'application/xml': {
            schema: { type: 'string' },
            examples: {
              default: { value: '<user><name>John</name></user>' },
            },
          },
        },
      })
    })

    it('keeps JSON schema shape when Content-Type is application/json', () => {
      const body: RequestBody = {
        mode: 'raw',
        raw: '{"ok":true}',
      }

      const result = extractRequestBody(body, 'default', 'application/json')

      expect(result).toEqual({
        content: {
          'application/json': {
            schema: { type: 'object' },
            examples: {
              default: { value: '{"ok":true}' },
            },
          },
        },
      })
    })

    it('keeps text/plain schema shape when Content-Type is text/plain', () => {
      const body: RequestBody = {
        mode: 'raw',
        raw: 'hello',
      }

      const result = extractRequestBody(body, 'default', 'text/plain')

      expect(result).toEqual({
        content: {
          'text/plain': {
            schema: { type: 'string', examples: ['hello'] },
          },
        },
      })
    })

    it('falls back to language hint when no Content-Type', () => {
      const body: RequestBody = {
        mode: 'raw',
        raw: '{"ok":true}',
        options: { raw: { language: 'json' } },
      }

      const result = extractRequestBody(body, 'default')

      expect(result.content?.['application/json']).toBeDefined()
    })

    it('falls back to text/plain when neither Content-Type nor language is set', () => {
      const body: RequestBody = {
        mode: 'raw',
        raw: 'plain text',
      }

      const result = extractRequestBody(body, 'default')

      expect(result.content?.['text/plain']).toBeDefined()
    })
  })
})

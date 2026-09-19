import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { getQuerystringParameter, serializeQuerystringParameter } from '@/helpers/querystring-parameter'
import { coerceValue } from '@/schemas/typebox-coerce'
import { generateSchema } from '@/schemas/v3.2/openapi'
import { recursiveRef } from '@/schemas/v3.2/openapi/reference'
import { type ParameterObject, ParameterObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

const parameter = (contentType: string, value: unknown): ParameterObject => ({
  name: 'metadata',
  in: 'querystring',
  required: true,
  content: { [contentType]: { examples: { default: { dataValue: value } } } },
})

const serialize = (input: ParameterObject, variables: Record<string, string> = {}): string | undefined => {
  const querystring = getQuerystringParameter(input, 'default')
  return querystring ? serializeQuerystringParameter(querystring, variables) : undefined
}

describe('querystring-parameter', () => {
  it.each([
    {
      name: 'parameter serializedValue',
      parameterExample: { serializedValue: '%22hello%22' },
      mediaExample: { dataValue: 'ignored' },
      kind: 'uri-ready',
      value: '%22hello%22',
    },
    {
      name: 'media serializedValue',
      mediaExample: { serializedValue: '"hello"' },
      kind: 'serialized',
      value: '"hello"',
    },
    { name: 'string dataValue', mediaExample: { dataValue: 'hello' }, kind: 'data', value: 'hello' },
    { name: 'plain string value', mediaExample: { value: '"hello"' }, kind: 'serialized', value: '"hello"' },
    { name: 'plain object value', mediaExample: { value: { hello: true } }, kind: 'data', value: { hello: true } },
    { name: 'schema-generated string', kind: 'data', value: 'hello' },
  ])('classifies $name before encoding', ({ parameterExample, mediaExample, kind, value }) => {
    const input: ParameterObject = {
      name: 'query',
      in: 'querystring',
      required: true,
      ...(parameterExample ? { examples: { default: parameterExample } } : {}),
      content: {
        'application/json': {
          schema: { type: 'string', default: 'hello' },
          ...(mediaExample ? { examples: { default: mediaExample } } : {}),
        },
      },
    }
    expect(getQuerystringParameter(input, 'default')).toMatchObject({ kind, value })
  })

  it('preserves whole-query examples in the active document schema', () => {
    const input = parameter('application/x-www-form-urlencoded', { q: 'a b' })
    const document = {
      openapi: '3.2.1',
      info: { title: 'Query', version: '1' },
      paths: { '/search': { get: { parameters: [input] } } },
    }
    const result = coerce(generateSchema(recursiveRef), document)
    expect(getValueAtPath(result, ['paths', '/search', 'get', 'parameters'])).toStrictEqual([input])
  })

  it('preserves querystring content and OpenAPI 3.2 examples through coercion', () => {
    const input = parameter('application/json', { flag: true })
    expect(coerceValue(ParameterObjectSchema, input)).toStrictEqual(input)
  })

  it('encodes form values without using the parameter name', () => {
    expect(serialize(parameter('application/x-www-form-urlencoded', { foo: 'a + b', bar: true }))).toBe(
      'foo=a+%2B+b&bar=true',
    )
  })

  it('repeats arrays and serializes object properties as JSON by default', () => {
    expect(
      serialize(parameter('application/x-www-form-urlencoded', { tag: ['a', 'b'], address: { city: 'New York' } })),
    ).toBe('tag=a&tag=b&address=%7B%22city%22%3A%22New+York%22%7D')
  })

  it('honors per-property encoding', () => {
    const input: ParameterObject = {
      name: 'metadata',
      in: 'querystring',
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          encoding: {
            ids: { explode: false },
            filter: { style: 'deepObject' },
            id: { contentType: 'application/json' },
          },
          example: { ids: [1, 2], filter: { active: true }, id: 'abc' },
        },
      },
    }
    expect(serialize(input)).toBe('ids=1%2C2&filter%5Bactive%5D=true&id=%22abc%22')
  })

  it('percent-encodes JSON as the entire query, without a trailing equals sign', () => {
    expect(serialize(parameter('application/json', { numbers: [1, 2], flag: null }))).toBe(
      '%7B%22numbers%22%3A%5B1%2C2%5D%2C%22flag%22%3Anull%7D',
    )
  })

  it('distinguishes JSON string data from an already serialized media example', () => {
    expect(serialize(parameter('application/json', 'hello'))).toBe('%22hello%22')
    expect(
      serialize({
        name: 'json',
        in: 'querystring',
        required: true,
        content: { 'application/json': { example: '{"a":1}' } },
      }),
    ).toBe('%7B%22a%22%3A1%7D')
  })

  it('preserves false, zero, null, and empty string data examples', () => {
    for (const value of [false, 0, null, '']) {
      expect(serialize(parameter('application/json', value))).toBe(encodeURIComponent(JSON.stringify(value)))
    }
  })

  it('preserves parameter-level serialized examples and overrides media examples', () => {
    const input = {
      ...parameter('application/json', { ignored: true }),
      examples: { default: { serializedValue: '%7b%22a%22%3a1%7d' } },
    }
    expect(serialize(input)).toBe('%7b%22a%22%3a1%7d')
  })

  it('encodes media-level serialized examples once', () => {
    const input: ParameterObject = {
      name: 'json',
      in: 'querystring',
      required: true,
      content: {
        'application/json': { examples: { default: { serializedValue: '{"a":"100%"}' } } },
      },
    }
    expect(serialize(input)).toBe('%7B%22a%22%3A%22100%25%22%7D')
  })

  it('preserves serialized form examples at both levels', () => {
    for (const atParameter of [false, true]) {
      const examples = { default: { serializedValue: 'foo=a+%2B+b&foo=c' } }
      expect(
        serialize({
          name: 'form',
          in: 'querystring',
          required: true,
          content: { 'application/x-www-form-urlencoded': atParameter ? {} : { examples } },
          ...(atParameter ? { examples } : {}),
        }),
      ).toBe('foo=a+%2B+b&foo=c')
    }
  })

  it('serializes text query formats without form delimiters', () => {
    expect(serialize(parameter('application/jsonpath', '$.a.b[1:1]'))).toBe('%24.a.b%5B1%3A1%5D')
  })

  it('substitutes environment values before encoding', () => {
    expect(serialize(parameter('application/x-www-form-urlencoded', { q: '{{search}}' }), { search: 'a&b + c' })).toBe(
      'q=a%26b+%2B+c',
    )
    expect(serialize(parameter('application/json', { q: '{{search}}' }), { search: '"&' })).toBe(
      '%7B%22q%22%3A%22%5C%22%26%22%7D',
    )
  })

  it('generates a value from a content schema when no example is provided', () => {
    expect(
      serialize({
        name: 'json',
        in: 'querystring',
        required: true,
        content: { 'application/json': { schema: { type: 'string', default: 'hello' } } },
      }),
    ).toBe('%22hello%22')
  })

  it('honors optional and explicitly disabled examples', () => {
    const input = { ...parameter('application/json', {}), required: false }
    expect(serialize(input)).toBeUndefined()
    expect(serialize({ ...input, examples: { default: { dataValue: {}, 'x-disabled': false } } })).toBe('%7B%7D')
    expect(
      serialize({ ...input, required: true, examples: { default: { dataValue: {}, 'x-disabled': true } } }),
    ).toBeUndefined()
  })
})

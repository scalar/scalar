import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { flattenDeepObjectQueryParameter } from './flatten-deep-object-query-parameter'

describe('flatten-deep-object-query-parameter', () => {
  it('returns non deepObject parameters unchanged', () => {
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'search',
      schema: coerce(openapiSchemas.schema, {
        type: 'string',
      }),
      required: false,
      deprecated: false,
    })

    const result = flattenDeepObjectQueryParameter(parameter)

    expect(result).toStrictEqual([parameter])
  })

  it('flattens deepObject query parameters to bracket names', () => {
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'page',
      style: 'deepObject',
      explode: true,
      schema: coerce(openapiSchemas.schema, {
        type: 'object',
        properties: {
          number: {
            type: 'integer',
            description: 'Page number',
          },
          size: {
            type: 'integer',
            description: 'Page size',
          },
        },
        required: ['number'],
      }),
      required: false,
      deprecated: false,
      example: { number: 1, size: 10 },
      examples: {
        default: {
          value: { number: 1, size: 10 },
        },
      },
    })

    const result = flattenDeepObjectQueryParameter(parameter)

    expect(result.map((item) => item.name)).toStrictEqual(['page[number]', 'page[size]'])
    expect(result.map((item) => item.required)).toStrictEqual([true, false])
    expect(result.map((item) => item.description)).toStrictEqual(['Page number', 'Page size'])
    expect(result.every((item) => !('example' in item))).toBe(true)
    expect(result.every((item) => !('examples' in item))).toBe(true)
  })

  it('does not re-add the top-level parameter for empty nested object properties', () => {
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'filter',
      style: 'deepObject',
      explode: true,
      schema: coerce(openapiSchemas.schema, {
        type: 'object',
        properties: {
          pagination: {
            type: 'object',
            properties: {},
          },
          status: {
            type: 'string',
          },
        },
      }),
      required: false,
      deprecated: false,
    })

    const result = flattenDeepObjectQueryParameter(parameter)

    expect(result.map((item) => item.name)).toStrictEqual(['filter[pagination]', 'filter[status]'])
  })
})

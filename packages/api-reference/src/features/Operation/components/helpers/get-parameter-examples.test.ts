import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { ParameterObjectSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getParameterExamples } from './get-parameter-examples'

describe('get-parameter-examples', () => {
  it('unwraps named parameter examples without losing false or null', () => {
    expect(
      getParameterExamples({
        parameter: {
          name: 'term',
          in: 'query',
          examples: {
            data: { dataValue: { id: 1 } },
            wire: { serializedValue: 'term=a%20b' },
            no: { dataValue: false },
            empty: { dataValue: null },
          },
        },
      }),
    ).toStrictEqual([{ value: { id: 1 } }, { value: 'term=a%20b' }, { value: false }, { value: null }])
  })

  it('renders querystring data examples and prefers parameter examples', () => {
    expect(
      getParameterExamples({
        parameter: {
          name: 'metadata',
          in: 'querystring',
          content: { 'application/json': {} },
          examples: { default: { dataValue: false }, wire: { serializedValue: '%7B%7D' } },
        },
        contentExamples: { default: { dataValue: true } },
      }),
    ).toStrictEqual([{ value: false }, { value: '%7B%7D' }])
  })

  it('preserves object fields named value and externalValue for the example renderer', () => {
    const value = { value: 'abc', externalValue: 'local', unit: 'kg' }
    expect(
      getParameterExamples({
        parameter: {
          name: 'search',
          in: 'querystring',
          content: { 'application/json': {} },
          examples: { default: { dataValue: value } },
        },
      }),
    ).toStrictEqual([{ value }])
  })

  it('ignores undefined example keys and returns no examples', () => {
    const parameter = coerceValue(ParameterObjectSchema, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: coerceValue(SchemaObjectSchema, {
        type: 'string',
      }),
      example: undefined,
      examples: undefined,
    })

    const examples = getParameterExamples({
      parameter,
      schemaExamples: undefined,
      contentExamples: undefined,
    })

    expect(examples).toStrictEqual([])
  })

  it('uses parameter example fallback when defined and no other examples exist', () => {
    const parameter = coerceValue(ParameterObjectSchema, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: coerceValue(SchemaObjectSchema, {
        type: 'string',
      }),
      example: 'active',
    })

    const examples = getParameterExamples({
      parameter,
      schemaExamples: undefined,
      contentExamples: undefined,
    })

    expect(examples).toStrictEqual(['active'])
  })

  it('prefers schema examples and removes undefined entries', () => {
    const parameter = coerceValue(ParameterObjectSchema, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: coerceValue(SchemaObjectSchema, {
        type: 'string',
      }),
      example: 'active',
      examples: {
        first: { value: undefined },
      },
    })

    const examples = getParameterExamples({
      parameter,
      schemaExamples: [undefined, 'archived'],
      contentExamples: undefined,
    })

    expect(examples).toStrictEqual([{ value: undefined }, 'archived'])
  })
})

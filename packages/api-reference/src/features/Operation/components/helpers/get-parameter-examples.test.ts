import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { ParameterObjectSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getParameterExamples } from './get-parameter-examples'

describe('get-parameter-examples', () => {
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

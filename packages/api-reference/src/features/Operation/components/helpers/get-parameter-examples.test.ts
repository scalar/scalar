import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { getParameterExamples } from './get-parameter-examples'

describe('get-parameter-examples', () => {
  it('ignores undefined example keys and returns no examples', () => {
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: coerce(openapiSchemas.schema, {
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
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: coerce(openapiSchemas.schema, {
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
    const parameter = coerce(openapiSchemas.parameter, {
      in: 'query',
      name: 'filter[status]',
      required: false,
      schema: {
        type: 'string',
      },
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

    // Example objects with only `value: undefined` serialize as `{}`.
    expect(examples).toStrictEqual([{}, 'archived'])
  })
})

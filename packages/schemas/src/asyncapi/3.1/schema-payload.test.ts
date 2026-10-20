import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { schema as openApiSchema } from '@/openapi/3.1/schema'

import { asyncApiSchemaObjectOrReference } from './schema-payload'

describe('schema-payload', () => {
  it('accepts string discriminators recursively in AsyncAPI schemas', () => {
    expect(
      validate(asyncApiSchemaObjectOrReference, {
        type: 'object',
        properties: {
          pet: { type: 'object', discriminator: 'kind', required: ['kind'], properties: { kind: { type: 'string' } } },
        },
      }),
    ).toBe(true)
  })

  it('keeps OpenAPI object discriminators distinct', () => {
    expect(validate(openApiSchema, { discriminator: 'kind' })).toBe(false)
    expect(validate(openApiSchema, { discriminator: { propertyName: 'kind' } })).toBe(true)
    expect(validate(asyncApiSchemaObjectOrReference, { discriminator: { propertyName: 'kind' } })).toBe(false)
  })
})

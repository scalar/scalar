import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

import { getExampleFromSchema } from '@/request-example/builder/helpers/get-example-from-schema'
import { resolve } from '@/resolve'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

import { getAsyncApiSchemaView } from './get-async-api-schema-view'
import { getResolvedAsyncApiRef } from './get-resolved-async-api-ref'

describe('get-async-api-schema-view', () => {
  it('ignores nested siblings in shared rendering and example generation', () => {
    const document = createMagicProxy({
      target: { type: 'string', const: 'target', description: 'Target description' },
      schema: {
        type: 'object',
        properties: { value: { $ref: '#/target', const: 'sibling', description: 'Sibling description' } },
      },
    })
    const view = getAsyncApiSchemaView(document.schema) as SchemaObject & { properties: Record<string, SchemaObject> }
    expect(resolve.schema(view.properties?.value)?.description).toBe('Target description')
    expect(getExampleFromSchema(view)).toStrictEqual({ value: 'target' })
    expect(document.schema.properties.value.const).toBe('sibling')
    document.target.const = 'updated'
    expect(getExampleFromSchema(getAsyncApiSchemaView(document.schema) as SchemaObject)).toStrictEqual({
      value: 'updated',
    })
  })

  it('preserves literal reference data and schema property names', () => {
    const literal = { $ref: '#/literal', description: 'Data' }
    const source = {
      properties: { $ref: { type: 'string' } },
      default: literal,
      examples: [literal],
      'x-data': literal,
    }
    expect(getAsyncApiSchemaView(source)).toStrictEqual(source)
  })

  it('preserves recursive references, boolean targets, and composition', () => {
    const document = createMagicProxy({
      schema: {
        type: 'object',
        properties: { next: { $ref: '#/schema', description: 'Ignored' } },
        allOf: [{ $ref: '#/never', title: 'Ignored' }],
      },
      never: false,
    })
    const view = getAsyncApiSchemaView(document.schema) as SchemaObject & { properties: Record<string, SchemaObject> }
    expect(getResolvedAsyncApiRef(view.properties?.next)).toBe(view)
    expect(getResolvedAsyncApiRef(view.allOf?.[0])).toBe(false)
    expect(resolve.schema(view.properties?.next)?.description).toBeUndefined()
  })

  it.each(['application/vnd.aai.asyncapi+json;version=3.1.0', 'application/schema+json;version=draft-07'])(
    'ignores siblings in %s',
    (format) => {
      const reference = { $ref: '#/value', '$ref-value': { type: 'string' }, description: 'Ignored' }
      const view = getAsyncApiSchemaView(reference, format) as SchemaObject & {
        properties: Record<string, SchemaObject>
      }
      expect(resolve.schema(view)?.description).toBeUndefined()
    },
  )

  it('leaves foreign schema formats to their own resolver', () => {
    const schema = { $ref: '#/value', description: 'Foreign sibling' }
    expect(getAsyncApiSchemaView(schema, 'application/schema+json;version=draft-2020-12')).toBe(schema)
    expect(getAsyncApiSchemaView(schema, 'application/vnd.apache.avro+json;version=1.9.0')).toBe(schema)
  })
})

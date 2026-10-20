import { describe, expect, it } from 'vitest'

import { resolveAsyncApiSchema } from './resolve-async-api-schema'

describe('resolve-async-api-schema', () => {
  it.each([
    'application/schema+json;version=draft-07',
    'application/schema+yaml;version=draft-07',
    'application/vnd.aai.asyncapi;version=3.1.0',
    'application/vnd.aai.asyncapi+json;version=3.0.0',
    'application/vnd.aai.asyncapi+yaml;version=3.1.0',
    'application/vnd.oai.openapi;version=3.0.0',
    'application/vnd.oai.openapi+json;version=3.0.0',
    'application/vnd.oai.openapi+yaml;version=3.0.0',
    ' Application/Schema+JSON ; version=draft-07',
    undefined,
  ])('renders JSON Schema family %s structurally', (schemaFormat) => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } }
    expect(resolveAsyncApiSchema({ schemaFormat, schema })).toStrictEqual({ kind: 'schema', schema })
    expect(resolveAsyncApiSchema(schema)).toStrictEqual({ kind: 'schema', schema })
  })

  it.each([
    ['application/vnd.apache.avro+json;version=1.9.0', { type: 'record', name: 'User', fields: [] }],
    ['application/vnd.apache.avro+yaml;version=1.9.0', ['null', 'string']],
    ['application/vnd.apache.avro;version=1.9.0', 'string'],
    ['application/vnd.google.protobuf;version=3', 'message User { string id = 1; }'],
    ['application/vnd.google.protobuf;version=2', 'message User { required string id = 1; }'],
    ['application/x-custom', false],
    ['application/x-custom', null],
    ['application/x-custom', { properties: { misleadingField: {} } }],
  ])('preserves %s source', (schemaFormat, schema) => {
    const expected = { kind: 'source', format: schemaFormat, value: schema }
    expect(resolveAsyncApiSchema({ schemaFormat, schema })).toStrictEqual(expected)
    expect(
      resolveAsyncApiSchema({
        $ref: '#/components/schemas/User',
        '$ref-value': { schemaFormat, schema: { $ref: './user.schema', '$ref-value': schema } },
      }),
    ).toStrictEqual(expected)
  })

  it.each([
    undefined,
    { $ref: '#/missing' },
    { schemaFormat: 'application/x-custom' },
    {
      schemaFormat: 'application/x-custom',
      schema: { $ref: './missing' },
    },
  ])('omits missing or unresolved values: %j', (value) => {
    expect(resolveAsyncApiSchema(value)).toBeUndefined()
  })

  it.each([true, false])('preserves boolean validation meaning: %j', (schema) => {
    expect(resolveAsyncApiSchema({ schemaFormat: 'application/schema+json', schema })).toStrictEqual({
      kind: 'schema',
      schema: schema ? { description: 'Accepts any value.' } : { not: {}, description: 'Accepts no value.' },
    })
  })
})

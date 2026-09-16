import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getGeneratedPayloadExample } from './get-generated-payload-example'

/** Keep fixtures permissive enough to exercise unsupported input from user documents. */
const generate = (message: Record<string, unknown>): unknown =>
  getGeneratedPayloadExample(message as AsyncApiMessageObject)

describe('get-generated-payload-example', () => {
  it.each(['const', 'example', 'default'])('preserves literal __proto__ fields in %s data', (keyword) => {
    const value = JSON.parse('{"__proto__":{"id":1},"normal":2}')
    expect(generate({ payload: { type: 'object', [keyword]: value } })).toStrictEqual(value)
  })

  it.each(['const', 'example', 'default'])('preserves literal $ref fields in %s data', (keyword) => {
    const value = { $ref: 'literal', id: 1 }
    expect(generate({ payload: { type: 'object', [keyword]: value } })).toStrictEqual(value)
  })

  it('preserves a property named $ref', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            $ref: { type: 'string', const: 'literal' },
            id: { type: 'integer', const: 1 },
          },
        },
      }),
    ).toStrictEqual({ $ref: 'literal', id: 1 })
  })

  it('generates an object using schema examples, defaults, and enums', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            id: { type: 'string', examples: ['evt-1'] },
            count: { type: 'integer', default: 3 },
            kind: { type: 'string', enum: ['created'] },
          },
        },
      }),
    ).toStrictEqual({ id: 'evt-1', count: 3, kind: 'created' })
  })

  it.each([null, false, 0, '', { id: 'authored' }])('preserves an explicit %j payload', (payload) => {
    expect(generate({ payload: { type: 'string' }, examples: [{ payload }] })).toBeUndefined()
  })

  it('resolves explicit example references before deciding whether to generate', () => {
    expect(
      generate({ payload: { type: 'string' }, examples: [{ $ref: '#/example', '$ref-value': { payload: false } }] }),
    ).toBeUndefined()
  })

  it('generates alongside header-only and unresolved examples', () => {
    expect(
      generate({
        payload: { type: 'string', const: 'hello' },
        examples: [{ headers: { trace: 'abc' } }, { $ref: '#/missing' }, { name: 'Empty' }],
      }),
    ).toBe('hello')
  })

  it.each([
    [{ type: 'string', const: 'hello' }, 'hello'],
    [{ type: 'boolean', const: false }, false],
    [{ type: 'integer', const: 0 }, 0],
    [{ type: 'null' }, null],
    [{ type: 'array', items: { type: 'string', const: 'item' } }, ['item']],
    [{ type: 'object', examples: [{ id: 'schema-example' }] }, { id: 'schema-example' }],
  ])('generates values for %j', (payload, expected) => {
    expect(generate({ payload })).toStrictEqual(expected)
  })

  it('resolves nested references and compositions', () => {
    expect(
      generate({
        payload: {
          allOf: [
            {
              $ref: '#/base',
              '$ref-value': { type: 'object', properties: { id: { type: 'string', const: 'evt-1' } } },
            },
            {
              type: 'object',
              properties: {
                data: {
                  $ref: '#/data',
                  '$ref-value': {
                    oneOf: [{ type: 'integer', const: 42 }, { type: 'string' }],
                  },
                },
              },
            },
          ],
        },
      }),
    ).toStrictEqual({ id: 'evt-1', data: 42 })
  })

  it.each([
    'application/vnd.aai.asyncapi+json;version=3.0.0',
    'application/vnd.aai.asyncapi+yaml;version=3.1.0',
    'application/schema+json;version=draft-07',
    'application/schema+yaml;version=draft-07',
  ])('unwraps %s schemas', (schemaFormat) => {
    expect(
      generate({
        payload: {
          $ref: '#/wrapped',
          '$ref-value': {
            schemaFormat,
            schema: { $ref: '#/schema', '$ref-value': { type: 'string', const: 'wrapped' } },
          },
        },
      }),
    ).toBe('wrapped')
  })

  it.each([
    undefined,
    true,
    false,
    { $ref: '#/missing' },
    { schemaFormat: 'application/vnd.apache.avro+json;version=1.9.0', schema: { type: 'string' } },
    { schemaFormat: 'application/vnd.google.protobuf;version=3', schema: 'message Event {}' },
  ])('skips unsupported or missing schemas: %j', (payload) => {
    expect(generate({ payload })).toBeUndefined()
  })

  it('includes read-only, write-only, and deprecated fields like the schema view', () => {
    expect(
      generate({
        payload: {
          type: 'object',
          properties: {
            read: { type: 'string', const: 'r', readOnly: true },
            write: { type: 'string', const: 'w', writeOnly: true },
            old: { type: 'string', const: 'o', deprecated: true },
          },
        },
      }),
    ).toStrictEqual({ read: 'r', write: 'w', old: 'o' })
  })

  it('terminates for recursive payloads without changing the schema', () => {
    const payload: Record<string, unknown> = { type: 'object', properties: {} }
    const reference = { $ref: '#/recursive', '$ref-value': payload }
    payload.properties = { id: { type: 'string', const: 'event' }, child: reference }
    const result = generate({ payload })
    expect(JSON.stringify(result)).toContain('"id":"event"')
    expect(payload.properties).toStrictEqual({ id: { type: 'string', const: 'event' }, child: reference })
  })
})

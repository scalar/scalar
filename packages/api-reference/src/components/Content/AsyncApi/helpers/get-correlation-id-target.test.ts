import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import { getCorrelationIdTarget } from './get-correlation-id-target'

const message: AsyncApiMessageObject = {
  headers: { type: 'object', properties: { correlationId: { type: 'string' } } },
  payload: {
    type: 'object',
    properties: {
      metadata: { type: 'object', properties: { id: { type: 'string' } } },
      'a/b~c': { type: 'string' },
      'a%20b': { type: 'string' },
      'a b': { type: 'string' },
      'a.b': { type: 'string' },
      '': { type: 'string' },
    },
  },
}

describe('get-correlation-id-target', () => {
  it('skips anchors shared by dotted keys and fields below recursive references', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        metadata: { type: 'object' as const, properties: { id: { type: 'string' as const } } },
        'metadata.id': { type: 'string' as const },
      },
    }
    expect(getCorrelationIdTarget({ payload: schema }, '$message.payload#/metadata/id')).toBeUndefined()
    const recursive: AsyncApiMessageObject = {
      payload: {
        type: 'object',
        properties: { next: { $ref: '#/components/schemas/Node' }, id: { type: 'string' } },
      },
    }
    const payload = recursive.payload as { properties: Record<string, unknown> }
    payload.properties.next = { $ref: '#/components/schemas/Node', '$ref-value': recursive.payload }
    expect(getCorrelationIdTarget(recursive, '$message.payload#/next/id')).toBeUndefined()
  })

  it.each([
    ['$message.header#/correlationId', { section: 'headers', path: ['correlationId'] }],
    ['$message.payload#/metadata/id', { section: 'payload', path: ['metadata', 'id'] }],
    ['$message.payload#/a~1b~0c', { section: 'payload', path: ['a/b~c'] }],
    ['$message.payload#/a%2520b', { section: 'payload', path: ['a%20b'] }],
    ['$message.payload#/a%20b', { section: 'payload', path: ['a b'] }],
    ['$message.payload', { section: 'payload', path: [] }],
    ['$message.header#', { section: 'headers', path: [] }],
  ])('locates %s in the message schema', (location, expected) => {
    expect(getCorrelationIdTarget(message, location)).toStrictEqual(expected)
  })

  it.each([
    '$message.headers#/correlationId',
    '$request.header#/correlationId',
    '$message.payload#metadata/id',
    '$message.payload#/missing',
    '$message.payload#/metadata/missing',
    '$message.payload#/metadata/id/child',
    '$message.payload#/a%GG',
    '$message.payload#/a~2b',
    '$message.payload#/a.b',
    '$message.payload#/',
  ])('keeps %s unlinked when no unambiguous rendered field exists', (location) => {
    expect(getCorrelationIdTarget(message, location)).toBeUndefined()
  })

  it('resolves both the schema root and nested property references', () => {
    const metadata = {
      $ref: '#/components/schemas/Metadata',
      '$ref-value': { type: 'object' as const, properties: { id: { type: 'string' as const } } },
    }
    const referenced: AsyncApiMessageObject = {
      payload: {
        $ref: '#/components/schemas/Payload',
        '$ref-value': {
          type: 'object',
          properties: {
            metadata,
          },
        },
      },
    }
    expect(getCorrelationIdTarget(referenced, '$message.payload#/metadata/id')).toStrictEqual({
      section: 'payload',
      path: ['metadata', 'id'],
    })
  })

  it('unwraps supported schema formats and skips other formats', () => {
    const payload = { type: 'object', properties: { id: { type: 'string' } } }
    expect(
      getCorrelationIdTarget(
        {
          payload: {
            schemaFormat: 'application/schema+json;version=draft-07',
            schema: payload,
          },
        },
        '$message.payload#/id',
      ),
    ).toStrictEqual({ section: 'payload', path: ['id'] })
    expect(
      getCorrelationIdTarget(
        {
          payload: {
            schemaFormat: 'application/vnd.apache.avro+json;version=1.9.0',
            schema: payload,
          },
        },
        '$message.payload#/id',
      ),
    ).toBeUndefined()
  })

  it('does not mistake example data or schema keywords for fields', () => {
    expect(getCorrelationIdTarget(message, '$message.payload#/properties/metadata')).toBeUndefined()
    expect(
      getCorrelationIdTarget({ payload: { type: 'object', example: { id: 'example' } } }, '$message.payload#/id'),
    ).toBeUndefined()
    expect(getCorrelationIdTarget({ payload: { $ref: '#/missing' } }, '$message.payload#/id')).toBeUndefined()
  })

  it.each(['allOf', 'oneOf', 'anyOf'])('locates fields in flattened %s compositions', (composition) => {
    const variant = { type: 'object' as const, properties: { id: { type: 'string' as const } } }
    expect(getCorrelationIdTarget({ payload: { [composition]: [variant] } }, '$message.payload#/id')).toStrictEqual({
      section: 'payload',
      path: ['id'],
    })
    expect(
      getCorrelationIdTarget(
        { payload: { type: 'object', properties: { metadata: { [composition]: [variant, { type: 'null' }] } } } },
        '$message.payload#/metadata/id',
      ),
    ).toStrictEqual({ section: 'payload', path: ['metadata', 'id'] })
  })

  it('skips fields in ambiguous variants and unnamed array items', () => {
    const variant = { type: 'object' as const, properties: { id: { type: 'string' as const } } }
    expect(getCorrelationIdTarget({ payload: { oneOf: [variant, variant] } }, '$message.payload#/id')).toBeUndefined()
    expect(
      getCorrelationIdTarget({ payload: { type: 'array', items: variant } }, '$message.payload#/0/id'),
    ).toBeUndefined()
  })
})

import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { describe, expect, it } from 'vitest'

import {
  getAsyncApiMessageHeadersSchema,
  getAsyncApiMessagePayloadSchema,
  unwrapAsyncApiSchema,
} from './get-async-api-message-payload-schema'

const asMessage = (message: unknown): AsyncApiMessageObject => message as AsyncApiMessageObject

describe('unwrapAsyncApiSchema', () => {
  it('returns a plain JSON Schema object as-is', () => {
    const schema = { type: 'object', properties: { id: { type: 'string' } } }
    expect(unwrapAsyncApiSchema(schema)).toEqual(schema)
  })

  it('unwraps a Multi Format Schema Object to its inner payload', () => {
    const inner = { type: 'object', properties: { name: { type: 'string' } } }
    const wrapper = { schemaFormat: 'application/vnd.aai.asyncapi+json;version=3.0.0', schema: inner }
    expect(unwrapAsyncApiSchema(wrapper)).toEqual(inner)
  })

  it('resolves a $ref to its embedded $ref-value', () => {
    const target = { type: 'object', properties: { id: { type: 'string' } } }
    const ref = { $ref: '#/components/schemas/Planet', '$ref-value': target }
    expect(unwrapAsyncApiSchema(ref)).toEqual(target)
  })

  it('returns undefined for a missing value', () => {
    expect(unwrapAsyncApiSchema(undefined)).toBeUndefined()
  })

  it('skips boolean schemas', () => {
    expect(unwrapAsyncApiSchema(true)).toBeUndefined()
    expect(unwrapAsyncApiSchema(false)).toBeUndefined()
  })
})

describe('getAsyncApiMessagePayloadSchema', () => {
  it('returns the unwrapped payload schema', () => {
    const payload = { type: 'object', properties: { id: { type: 'string' } } }
    expect(getAsyncApiMessagePayloadSchema(asMessage({ payload }))).toEqual(payload)
  })

  it('returns undefined when there is no payload', () => {
    expect(getAsyncApiMessagePayloadSchema(asMessage({}))).toBeUndefined()
  })
})

describe('getAsyncApiMessageHeadersSchema', () => {
  it('returns the unwrapped headers schema', () => {
    const headers = { type: 'object', properties: { 'x-token': { type: 'string' } } }
    expect(getAsyncApiMessageHeadersSchema(asMessage({ headers }))).toEqual(headers)
  })

  it('returns undefined when there are no headers', () => {
    expect(getAsyncApiMessageHeadersSchema(asMessage({}))).toBeUndefined()
  })
})

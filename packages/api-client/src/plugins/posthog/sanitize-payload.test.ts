import { describe, expect, it } from 'vitest'

import { sanitizePayload } from './sanitize-payload'

describe('sanitizePayload', () => {
  it('returns empty object for null', () => {
    expect(sanitizePayload(null)).toEqual({})
  })

  it('returns empty object for undefined', () => {
    expect(sanitizePayload(undefined)).toEqual({})
  })

  it('returns empty object for a primitive', () => {
    expect(sanitizePayload('string')).toEqual({})
    expect(sanitizePayload(42)).toEqual({})
    expect(sanitizePayload(true)).toEqual({})
  })

  it('returns empty object for an empty object', () => {
    expect(sanitizePayload({})).toEqual({})
  })

  it('extracts collectionType when it is a string', () => {
    expect(sanitizePayload({ collectionType: 'document' })).toEqual({ collectionType: 'document' })
    expect(sanitizePayload({ collectionType: 'workspace' })).toEqual({ collectionType: 'workspace' })
  })

  it('ignores collectionType when it is not a string', () => {
    expect(sanitizePayload({ collectionType: 42 })).toEqual({})
    expect(sanitizePayload({ collectionType: null })).toEqual({})
    expect(sanitizePayload({ collectionType: { nested: true } })).toEqual({})
  })

  it('extracts format when it is a string', () => {
    expect(sanitizePayload({ format: 'json' })).toEqual({ format: 'json' })
    expect(sanitizePayload({ format: 'yaml' })).toEqual({ format: 'yaml' })
  })

  it('ignores format when it is not a string', () => {
    expect(sanitizePayload({ format: 123 })).toEqual({})
  })

  it('extracts contentType when it is a string', () => {
    expect(sanitizePayload({ contentType: 'application/json' })).toEqual({ contentType: 'application/json' })
  })

  it('ignores contentType when it is not a string', () => {
    expect(sanitizePayload({ contentType: [] })).toEqual({})
  })

  it('extracts meta.type when meta is an object with a string type', () => {
    expect(sanitizePayload({ meta: { type: 'document' } })).toEqual({ 'meta.type': 'document' })
    expect(sanitizePayload({ meta: { type: 'operation' } })).toEqual({ 'meta.type': 'operation' })
  })

  it('ignores meta.type when meta is not an object', () => {
    expect(sanitizePayload({ meta: 'string' })).toEqual({})
    expect(sanitizePayload({ meta: null })).toEqual({})
  })

  it('ignores meta.type when type inside meta is not a string', () => {
    expect(sanitizePayload({ meta: { type: 99 } })).toEqual({})
    expect(sanitizePayload({ meta: { type: null } })).toEqual({})
  })

  it('extracts payload.type when inner payload is an object with a string type', () => {
    expect(sanitizePayload({ payload: { type: 'apiKey' } })).toEqual({ 'payload.type': 'apiKey' })
  })

  it('extracts payload.contentType when inner payload is an object with a string contentType', () => {
    expect(sanitizePayload({ payload: { contentType: 'multipart/form-data' } })).toEqual({
      'payload.contentType': 'multipart/form-data',
    })
  })

  it('extracts both payload.type and payload.contentType from inner payload', () => {
    expect(sanitizePayload({ payload: { type: 'bearer', contentType: 'application/json' } })).toEqual({
      'payload.type': 'bearer',
      'payload.contentType': 'application/json',
    })
  })

  it('ignores payload fields when inner payload is not an object', () => {
    expect(sanitizePayload({ payload: 'raw string' })).toEqual({})
    expect(sanitizePayload({ payload: null })).toEqual({})
  })

  it('ignores payload.type when type inside inner payload is not a string', () => {
    expect(sanitizePayload({ payload: { type: false } })).toEqual({})
  })

  it('ignores unknown fields and does not forward them', () => {
    expect(sanitizePayload({ secret: 'password', token: 'abc123', body: { sensitive: true } })).toEqual({})
  })

  it('extracts all known fields from a realistic combined payload', () => {
    const payload = {
      collectionType: 'document',
      format: 'json',
      contentType: 'application/json',
      meta: { type: 'operation' },
      payload: { type: 'apiKey', contentType: 'text/plain' },
      secret: 'should-be-stripped',
    }

    expect(sanitizePayload(payload)).toEqual({
      collectionType: 'document',
      format: 'json',
      contentType: 'application/json',
      'meta.type': 'operation',
      'payload.type': 'apiKey',
      'payload.contentType': 'text/plain',
    })
  })
})

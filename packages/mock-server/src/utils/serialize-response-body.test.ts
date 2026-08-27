import { describe, expect, it } from 'vitest'

import { serializeResponseBody } from './serialize-response-body'

describe('serializeResponseBody', () => {
  it('encodes a string body under a JSON media type', () => {
    expect(serializeResponseBody('string', 'application/json', { type: 'string' })).toBe('"string"')
  })

  it('encodes a string body under a suffixed JSON media type', () => {
    expect(serializeResponseBody('nope', 'application/problem+json')).toBe('"nope"')
  })

  it('encodes a string body under a parameterized JSON media type', () => {
    expect(serializeResponseBody('string', 'application/json; charset=utf-8', { type: 'string' })).toBe('"string"')
  })

  it('encodes a string body under an uppercase JSON media type', () => {
    expect(serializeResponseBody('string', 'APPLICATION/JSON', { type: 'string' })).toBe('"string"')
  })

  it('encodes a string body a nullable string schema declares', () => {
    expect(serializeResponseBody('string', 'application/json', { type: ['string', 'null'] })).toBe('"string"')
  })

  it('encodes a numeric string a string schema declares', () => {
    expect(serializeResponseBody('123', 'application/json', { type: 'string' })).toBe('"123"')
  })

  it('encodes a scalar-looking string no schema declares', () => {
    expect(serializeResponseBody('123', 'application/json')).toBe('"123"')
    expect(serializeResponseBody('true', 'application/json')).toBe('"true"')
    expect(serializeResponseBody('"quoted"', 'application/json')).toBe('"\\"quoted\\""')
  })

  it('keeps a scalar a non-string schema declares', () => {
    expect(serializeResponseBody('123', 'application/json', { type: 'integer' })).toBe('123')
    expect(serializeResponseBody('true', 'application/json', { type: 'boolean' })).toBe('true')
  })

  it('encodes a body a non-string schema declares that does not parse', () => {
    expect(serializeResponseBody('N/A', 'application/json', { type: 'integer' })).toBe('"N/A"')
  })

  it('encodes a body a composite schema describes', () => {
    expect(serializeResponseBody('available', 'application/json', { enum: ['available', 'sold'] })).toBe('"available"')
    expect(serializeResponseBody('string', 'application/json', { allOf: [{ type: 'string' }] })).toBe('"string"')
  })

  it('encodes an empty string body', () => {
    expect(serializeResponseBody('', 'application/json', { type: 'string' })).toBe('""')
    expect(serializeResponseBody('', 'application/json')).toBe('""')
  })

  it('keeps a hand-serialized JSON document raw', () => {
    expect(serializeResponseBody('{"foo":"bar"}', 'application/json', { type: 'object' })).toBe('{"foo":"bar"}')
    // Whitespace around the document is part of the author's example, so the body is written as it is.
    expect(serializeResponseBody('  [1,2]  ', 'application/json')).toBe('  [1,2]  ')
  })

  it('keeps a hand-serialized JSON document raw when the schema omits a type', () => {
    expect(
      serializeResponseBody('{"foo":"bar"}', 'application/json', { properties: { foo: { type: 'string' } } }),
    ).toBe('{"foo":"bar"}')
  })

  it('encodes a serialized document a string schema declares', () => {
    expect(serializeResponseBody('{"foo":"bar"}', 'application/json', { type: 'string' })).toBe(
      '"{\\"foo\\":\\"bar\\"}"',
    )
  })

  it('encodes a string that only looks like a JSON document', () => {
    expect(serializeResponseBody('{not json', 'application/json')).toBe('"{not json"')
  })

  it.each([
    [{ foo: 'bar' }, '{"foo":"bar"}'],
    [[1, 2], '[1,2]'],
    [null, 'null'],
    [1, '1'],
    [true, 'true'],
  ])('serializes %j as JSON', (body, expected) => {
    expect(serializeResponseBody(body, 'application/json')).toBe(expected)
  })

  it('serializes an undefined body to nothing', () => {
    expect(serializeResponseBody(undefined, 'application/json')).toBeUndefined()
  })

  it('keeps a line-delimited JSON body raw', () => {
    expect(serializeResponseBody('{"foo":1}\n{"foo":2}', 'application/x-ndjson')).toBe('{"foo":1}\n{"foo":2}')
    expect(serializeResponseBody('{"foo":1}\n{"foo":2}', 'application/jsonl')).toBe('{"foo":1}\n{"foo":2}')
    expect(serializeResponseBody('{"foo":1}\n{"foo":2}', 'application/json-seq')).toBe('{"foo":1}\n{"foo":2}')
    expect(serializeResponseBody('{"foo":1}\n{"foo":2}', 'application/x-json-stream')).toBe('{"foo":1}\n{"foo":2}')
  })

  it('keeps a server-sent event body raw', () => {
    expect(serializeResponseBody('data: hello\n\n', 'text/event-stream')).toBe('data: hello\n\n')
  })

  it('keeps a plain text body raw', () => {
    expect(serializeResponseBody('hello', 'text/plain')).toBe('hello')
    expect(serializeResponseBody('hello', 'text/html')).toBe('hello')
  })

  it('keeps a body raw for a media type that only mentions JSON in a parameter', () => {
    expect(serializeResponseBody('hello', 'text/plain; format=json')).toBe('hello')
    expect(serializeResponseBody('hello', 'multipart/form-data; boundary=jsonBoundary')).toBe('hello')
  })

  it('keeps a string body raw when no media type was negotiated', () => {
    expect(serializeResponseBody('hello', undefined)).toBe('hello')
  })

  it('serializes an object as JSON when no media type was negotiated', () => {
    expect(serializeResponseBody({ foo: 'bar' }, undefined)).toBe('{"foo":"bar"}')
  })

  it('turns an object into XML', () => {
    expect(serializeResponseBody({ foo: 'bar' }, 'application/xml')).toContain('<foo>bar</foo>')
    expect(serializeResponseBody({ foo: 'bar' }, 'text/xml')).toContain('<foo>bar</foo>')
    expect(serializeResponseBody({ foo: 'bar' }, 'application/xhtml+xml')).toContain('<foo>bar</foo>')
  })

  it('serializes an object as JSON for a media type that only mentions XML in a parameter', () => {
    expect(serializeResponseBody({ foo: 'bar' }, 'text/plain; boundary=xmlBoundary')).toBe('{"foo":"bar"}')
  })

  it('keeps an XML string body raw', () => {
    expect(serializeResponseBody('<foo>bar</foo>', 'application/xml')).toBe('<foo>bar</foo>')
  })

  it('serializes a null XML body rather than building a document from it', () => {
    expect(serializeResponseBody(null, 'application/xml')).toBe('null')
  })
})

// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readSchema } from './read-schema'

const avro = 'application/vnd.apache.avro+json;version=1.9.0'
const raml = 'application/raml+yaml;version=1.0'
const proto = 'application/vnd.google.protobuf;version=3'

describe('read-schema', () => {
  it.each([
    [avro, { type: 'record', name: 'User', fields: [{ name: 'id', type: 'Missing' }] }],
    [avro, { type: 'enum', name: 'State', symbols: ['A', 'A'] }],
    [avro, { type: 'fixed', name: 'Hash', size: -1 }],
    [raml, 'type: !include user.raml'],
    [raml, 'type: Missing'],
    [raml, 'type: (string | number'],
    [raml, 'type: object\nproperties: ['],
    [raml, { type: 'object', uses: { common: './common.raml' } }],
    [proto, 'syntax = "proto3"; import "user.proto"; message User { string id = 1; }'],
    [proto, 'syntax = "proto2"; message User { required string id = 1; }'],
    [proto, 'syntax = "proto3"; message User { Missing id = 1; }'],
    [proto, 'syntax = "proto3"; message User {'],
    ['application/vnd.apache.avro+json;version=9', { type: 'string' }],
    ['application/raml+yaml;version=0.8', { type: 'string' }],
    ['application/vnd.google.protobuf;version=2023', 'edition = "2023";'],
    ['application/x-custom', { properties: { id: { type: 'string' } } }],
    ['application/vnd.apache.avro+json', { type: 'string' }],
  ])('falls back for unsupported or malformed schemas: %s %j', (format, value) => {
    expect(readSchema(format, value)).toBeUndefined()
  })

  it('honors case-insensitive media types and quoted versions', () => {
    expect(readSchema(' Application/Vnd.Apache.Avro+JSON ; Version="1.9.0" ', 'string')).toStrictEqual({
      nodes: [{ name: 'Schema', type: 'string' }],
    })
  })

  it('bounds cyclic input, large source, and deep expressions', () => {
    const value: Record<string, unknown> = { type: 'array' }
    value.items = value
    expect(readSchema(avro, value)).toBeUndefined()
    expect(readSchema(raml, `type: ${'('.repeat(100)}string${')'.repeat(100)}`)).toBeUndefined()
    expect(readSchema(proto, ' '.repeat(200_001))).toBeUndefined()
  })
})

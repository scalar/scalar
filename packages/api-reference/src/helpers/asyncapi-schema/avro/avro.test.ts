// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readSchema } from '../read-schema'

const avro = 'application/vnd.apache.avro+json;version=1.9.0'

describe('avro', () => {
  it('preserves Avro reader defaults, unions, documentation, and recursive names', () => {
    expect(
      readSchema(avro, {
        type: 'record',
        name: 'User',
        namespace: 'example',
        fields: [
          { name: 'id', type: 'long', doc: 'User ID', default: 0 },
          { name: 'parent', type: ['null', 'User'], default: null },
        ],
      }),
    ).toStrictEqual({
      nodes: [
        {
          name: 'Schema',
          type: 'record example.User',
          children: [
            { name: 'id', type: 'long', description: 'User ID', readerDefault: 0 },
            {
              name: 'parent',
              type: 'union',
              children: [
                { name: 'Variant 1', type: 'null' },
                { name: 'Variant 2', type: 'User', details: ['Recursive reference'] },
              ],
              readerDefault: null,
            },
          ],
        },
      ],
    })
  })

  it('documents Avro enums, fixed, maps, arrays and logical types', () => {
    expect(
      readSchema(avro, { type: 'array', items: { type: 'map', values: { type: 'fixed', name: 'Hash', size: 16 } } }),
    ).toStrictEqual({
      nodes: [
        {
          name: 'Schema',
          type: 'array',
          children: [
            {
              name: 'Items',
              type: 'map',
              children: [{ name: 'Values', type: 'fixed Hash', details: ['Size: 16 bytes'] }],
            },
          ],
        },
      ],
    })
    expect(readSchema(avro, { type: 'enum', name: 'State', symbols: ['ON', 'OFF'] })).toStrictEqual({
      nodes: [{ name: 'Schema', type: 'enum State', details: ['Symbols: ON, OFF'] }],
    })
    expect(readSchema(avro, { type: 'long', logicalType: 'timestamp-millis' })).toStrictEqual({
      nodes: [{ name: 'Schema', type: 'long', details: ['Logical type: timestamp-millis'] }],
    })
  })

  it('resolves an Avro name defined by an earlier field', () => {
    const result = readSchema(avro, {
      type: 'record',
      name: 'User',
      fields: [
        { name: 'home', type: { type: 'record', name: 'Address', fields: [{ name: 'city', type: 'string' }] } },
        { name: 'work', type: 'Address' },
      ],
    })
    expect(result?.nodes[0]?.children?.[1]).toStrictEqual({
      name: 'work',
      type: 'record Address',
      children: [{ name: 'city', type: 'string' }],
    })
  })

  it('keeps an Avro reference in its defining namespace', () => {
    const result = readSchema(avro, {
      type: 'record',
      name: 'Root',
      namespace: 'first',
      fields: [
        { name: 'address', type: { type: 'record', name: 'Address', fields: [{ name: 'city', type: 'string' }] } },
        {
          name: 'other',
          type: { type: 'record', name: 'second.Other', fields: [{ name: 'address', type: 'first.Address' }] },
        },
      ],
    })
    expect(result?.nodes[0]?.children?.[1]?.children?.[0]).toStrictEqual({
      name: 'address',
      type: 'record first.Address',
      children: [{ name: 'city', type: 'string' }],
    })
  })
})

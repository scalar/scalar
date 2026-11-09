// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { toDisplaySchema } from '../to-display-schema'
import { readAvro } from './avro'

describe('avro-display', () => {
  it('preserves null as a union member without marking an Avro field optional', () => {
    const node = readAvro({
      type: 'record',
      name: 'R',
      fields: [{ name: 'id', type: ['null', 'long'], default: null }],
    }).nodes[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'object',
      properties: {
        id: { default: null, anyOf: [{ type: 'null' }, { type: 'integer', format: 'long' }] },
      },
    })
  })

  it.each([
    ['boolean', false],
    ['int', 0],
    ['string', ''],
    [{ type: 'array', items: 'int' }, [1, 2]],
    [{ type: 'map', values: 'boolean' }, { enabled: false }],
  ])('passes typed defaults to the shared renderer for %j', (type, value) => {
    const node = readAvro({ type: 'record', name: 'R', fields: [{ name: 'value', type, default: value }] }).nodes[0]!
    const display = toDisplaySchema(node)
    expect(display).toHaveProperty('properties.value.default', value)
    expect(display).not.toHaveProperty('required')
    expect(toDisplaySchema(node.children![0]!)).not.toHaveProperty('description')
  })

  it('does not invent a default for fields without one', () => {
    const node = readAvro({ type: 'record', name: 'R', fields: [{ name: 'value', type: 'int' }] }).nodes[0]!
    expect(toDisplaySchema(node)).not.toHaveProperty('properties.value.default')
  })

  it('preserves symbolic enums and does not invent a symbol for an empty enum', () => {
    expect(toDisplaySchema(readAvro({ type: 'enum', name: 'E', symbols: ['ON', 'OFF'] }).nodes[0]!)).toStrictEqual({
      type: 'string',
      format: 'enum E',
      enum: ['ON', 'OFF'],
    })
    expect(toDisplaySchema(readAvro({ type: 'enum', name: 'Empty', symbols: [] }).nodes[0]!).enum).toStrictEqual([])
  })

  it('preserves fixed sizes, logical annotations and map value structure', () => {
    expect(
      toDisplaySchema(
        readAvro({ type: 'map', values: { type: 'fixed', name: 'D', size: 12, logicalType: 'duration' } }).nodes[0]!,
      ),
    ).toStrictEqual({
      type: 'object',
      additionalProperties: {
        type: 'string',
        format: 'fixed D',
        description: 'Logical type: duration\n\nSize: 12 bytes',
      },
    })
  })
})

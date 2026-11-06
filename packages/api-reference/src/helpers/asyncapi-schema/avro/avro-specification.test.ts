// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readAvro } from './avro'

// Avro 1.8.2 and 1.9.0: Schema Declaration / Names / Logical Types.
// https://avro.apache.org/docs/1.9.0/spec.html
// https://avro.apache.org/docs/1.8.2/spec.html
// These exercise documentation parsing, not serialization or reader/writer resolution.
describe('avro-specification', () => {
  it.each(['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'])(
    'accepts both primitive schema forms: %s',
    (type) => {
      for (const version of ['1.8.2', '1.9.0']) {
        expect(readAvro(type, version)).toStrictEqual({ nodes: [{ name: 'Schema', type }] })
        expect(readAvro({ type }, version)).toStrictEqual(readAvro(type, version))
      }
    },
  )

  it('uses a fullname instead of an explicitly supplied namespace', () => {
    const schema = {
      type: 'record',
      name: 'a.Root',
      namespace: 'ignored',
      fields: [
        { name: 'child', type: { type: 'record', name: 'Child', fields: [] } },
        { name: 'again', type: 'a.Child' },
      ],
    }
    expect(readAvro(schema).nodes[0]?.children?.map(({ type }) => type)).toStrictEqual([
      'record a.Child',
      'record a.Child',
    ])
  })

  it('resets an inherited namespace with an explicit empty namespace', () => {
    expect(
      readAvro({
        type: 'record',
        name: 'a.Root',
        fields: [{ name: 'child', type: { type: 'record', name: 'Child', namespace: '', fields: [] } }],
      }).nodes[0]?.children?.[0]?.type,
    ).toBe('record Child')
  })

  it('allows distinct named types in a union and preserves branch order', () => {
    expect(
      readAvro([
        { type: 'record', name: 'A', fields: [] },
        { type: 'record', name: 'B', fields: [] },
      ]).nodes[0]?.children?.map(({ type }) => type),
    ).toStrictEqual(['record A', 'record B'])
  })

  it('preserves field documentation, ordering and aliases without making defaults optional', () => {
    expect(
      readAvro({
        type: 'record',
        name: 'R',
        fields: [{ name: 'id', type: 'int', default: 0, doc: 'Identifier', order: 'descending', aliases: ['old_id'] }],
      }).nodes[0]?.children,
    ).toStrictEqual([
      {
        name: 'id',
        type: 'int',
        description: 'Identifier',
        readerDefault: 0,
        details: ['Order: descending', 'aliases: ["old_id"]'],
      },
    ])
  })

  it('retains the 1.9 enum reader default but treats it as metadata in 1.8', () => {
    const schema = { type: 'enum', name: 'State', symbols: ['OFF', 'ON'], default: 'OFF' }
    expect(readAvro(schema, '1.9.0').nodes[0]?.details).toStrictEqual(['Symbols: OFF, ON', 'Reader enum default: OFF'])
    expect(readAvro(schema, '1.8.2').nodes[0]?.details).toStrictEqual(['Symbols: OFF, ON'])
    expect(() => readAvro({ ...schema, default: 'MISSING' }, '1.9.0')).toThrow()
    expect(readAvro({ ...schema, default: 'MISSING' }, '1.8.2').nodes[0]?.type).toBe('enum State')
  })

  it.each([
    ['date', 'int'],
    ['time-millis', 'int'],
    ['time-micros', 'long'],
    ['timestamp-millis', 'long'],
    ['timestamp-micros', 'long'],
  ])('preserves a valid %s annotation on %s', (logicalType, type) => {
    expect(readAvro({ type, logicalType }).nodes[0]?.details).toStrictEqual([`Logical type: ${logicalType}`])
  })

  it('recognizes uuid only in 1.9 and duration only on twelve-byte fixed', () => {
    expect(readAvro({ type: 'string', logicalType: 'uuid' }, '1.9.0').nodes[0]?.details).toStrictEqual([
      'Logical type: uuid',
    ])
    expect(readAvro({ type: 'string', logicalType: 'uuid' }, '1.8.2').nodes[0]?.details).toBeUndefined()
    expect(
      readAvro({ type: 'fixed', name: 'Duration', size: 12, logicalType: 'duration' }).nodes[0]?.details,
    ).toStrictEqual(['Logical type: duration', 'Size: 12 bytes'])
  })

  it('documents decimal precision and scale only when the annotation is valid', () => {
    expect(readAvro({ type: 'bytes', logicalType: 'decimal', precision: 4, scale: 2 }).nodes[0]?.details).toStrictEqual(
      ['Logical type: decimal', 'precision: 4', 'scale: 2'],
    )
    expect(
      readAvro({ type: 'fixed', name: 'Decimal', size: 1, logicalType: 'decimal', precision: 2 }).nodes[0]?.details,
    ).toStrictEqual(['Logical type: decimal', 'precision: 2', 'Size: 1 bytes'])
  })

  it.each([
    { type: 'string', logicalType: 'future-type' },
    { type: 'string', logicalType: 'date' },
    { type: 'bytes', logicalType: 'decimal' },
    { type: 'bytes', logicalType: 'decimal', precision: 0 },
    { type: 'bytes', logicalType: 'decimal', precision: 2, scale: 3 },
    { type: 'bytes', logicalType: 'decimal', precision: 2, scale: -1 },
    { type: 'bytes', logicalType: 'decimal', precision: 2.5 },
    { type: 'fixed', name: 'D', size: 1, logicalType: 'decimal', precision: 3 },
    { type: 'fixed', name: 'D', size: 8, logicalType: 'duration' },
  ])('ignores invalid or unknown logical annotations: %j', (schema) => {
    expect(readAvro(schema).nodes[0]?.details ?? []).toStrictEqual(
      'size' in schema ? [`Size: ${schema.size} bytes`] : [],
    )
  })

  it.each([
    ['int', 'int'],
    ['int', { type: 'int' }],
    [
      { type: 'array', items: 'int' },
      { type: 'array', items: 'string' },
    ],
    [
      { type: 'map', values: 'int' },
      { type: 'map', values: 'string' },
    ],
    [{ type: 'record', name: 'R', fields: [] }, 'R'],
    ['null', ['int', 'string']],
    [],
  ])('rejects invalid union members: %j', (...members) => {
    expect(() => readAvro(members)).toThrow()
  })

  it.each([
    { type: 'record', name: 'int', fields: [] },
    { type: 'record', name: 'a.string', fields: [] },
    { type: 'record', name: '9Bad', fields: [] },
    { type: 'record', name: 'R', namespace: 'bad..namespace', fields: [] },
    { type: 'record', name: 'R', namespace: 42, fields: [] },
    {
      type: 'record',
      name: 'R',
      fields: [
        { name: 'x', type: 'int' },
        { name: 'x', type: 'long' },
      ],
    },
    {
      type: 'record',
      name: 'R',
      fields: [
        { name: 'x', type: 'Later' },
        { name: 'y', type: { type: 'record', name: 'Later', fields: [] } },
      ],
    },
    { type: 'record', name: 'R', fields: [{ name: 'x', type: 'int', order: 'sideways' }] },
    { type: 'record', name: 'R', fields: [{ name: 'x', type: 'int', aliases: 'old' }] },
    { type: 'enum', name: 'E', symbols: ['a.b'] },
    { type: 'fixed', name: 'F', size: 1.5 },
    { type: 'array' },
    { type: 'map' },
    null,
    12,
  ])('rejects malformed schema declarations: %j', (schema) => {
    expect(() => readAvro(schema)).toThrow()
  })

  it('does not use aliases as definitions or lose case-sensitive lookup', () => {
    for (const reference of ['Alias', 'original']) {
      expect(() =>
        readAvro({ type: 'record', name: 'Original', aliases: ['Alias'], fields: [{ name: 'x', type: reference }] }),
      ).toThrow()
    }
  })

  it('ignores custom metadata without changing the underlying structure', () => {
    expect(readAvro({ type: 'string', custom: { anything: true } })).toStrictEqual(readAvro('string'))
  })
  it.each([
    ['null', null],
    ['boolean', false],
    ['int', -2147483648],
    ['int', 2147483647],
    ['long', 9007199254740991],
    ['double', 1.5],
    ['bytes', '\u00ff'],
    [{ type: 'fixed', name: 'F', size: 2 }, 'ab'],
    [{ type: 'enum', name: 'E', symbols: ['YES'] }, 'YES'],
    [{ type: 'array', items: 'int' }, [1, 2]],
    [{ type: 'map', values: 'boolean' }, { ok: true }],
    [{ type: 'record', name: 'Inner', fields: [{ name: 'id', type: 'string' }] }, { id: 'x' }],
    [['null', 'string'], null],
    [['string', 'null'], 'x'],
  ])('preserves a valid reader default for %j', (type, value) => {
    const result = readAvro({ type: 'record', name: 'Root', fields: [{ name: 'value', type, default: value }] })
    expect(result.nodes[0]?.children?.[0]?.readerDefault).toStrictEqual(value)
  })

  it.each([
    ['int', 2147483648],
    ['int', 1.5],
    ['boolean', 1],
    ['string', null],
    ['long', 9007199254740992],
    ['bytes', '\u0100'],
    [{ type: 'fixed', name: 'F', size: 2 }, 'a'],
    [{ type: 'enum', name: 'E', symbols: ['YES'] }, 'NO'],
    [{ type: 'array', items: 'int' }, ['x']],
    [{ type: 'map', values: 'boolean' }, { ok: 'true' }],
    [{ type: 'record', name: 'Inner', fields: [{ name: 'id', type: 'string' }] }, { id: 1 }],
    [['null', 'string'], 'x'],
    [['string', 'null'], null],
  ])('rejects a default incompatible with its schema or first union branch: %j', (type, value) => {
    expect(() =>
      readAvro({ type: 'record', name: 'Root', fields: [{ name: 'value', type, default: value }] }),
    ).toThrow()
  })

  it('checks recursive defaults with a finite union base case', () => {
    expect(
      readAvro({ type: 'record', name: 'Node', fields: [{ name: 'next', type: ['null', 'Node'], default: null }] })
        .nodes[0]?.children?.[0]?.readerDefault,
    ).toBeNull()
  })

  it('bounds schema expansion and cyclic defaults', () => {
    const cyclic: Record<string, unknown> = { type: 'array' }
    cyclic.items = cyclic
    expect(() => readAvro(cyclic)).toThrow()
    const value: Record<string, unknown> = {}
    value.next = value
    expect(() =>
      readAvro({ type: 'record', name: 'Node', fields: [{ name: 'next', type: 'Node', default: value }] }),
    ).toThrow()
    expect(() =>
      readAvro({
        type: 'record',
        name: 'R',
        fields: Array.from({ length: 2100 }, (_, i) => ({ name: `f${i}`, type: 'int' })),
      }),
    ).toThrow()
  })

  it('accepts empty records, enums and zero-byte fixed declarations', () => {
    expect(readAvro({ type: 'enum', name: 'Empty', symbols: [] }).nodes[0]?.details).toStrictEqual(['Symbols: '])
    expect(readAvro({ type: 'record', name: 'Empty', fields: [] }).nodes[0]?.children).toStrictEqual([])
    expect(readAvro({ type: 'fixed', name: 'Empty', size: 0 }).nodes[0]?.details).toStrictEqual(['Size: 0 bytes'])
  })

  it('does not confuse complex type keywords with named type identity in unions', () => {
    expect(
      readAvro([
        { type: 'record', name: 'array', fields: [] },
        { type: 'array', items: 'int' },
      ]).nodes[0]?.children?.map(({ type }) => type),
    ).toStrictEqual(['record array', 'array'])
  })

  it('accepts JSON source text, including quoted primitive names and top-level unions', () => {
    for (const schema of ['string', ['null', 'long'], { type: 'record', name: 'R', fields: [] }]) {
      expect(readAvro(JSON.stringify(schema))).toStrictEqual(readAvro(schema))
    }
  })

  it('only accepts YAML source text when that encoding is declared', () => {
    const source = 'type: record\nname: R\nfields:\n  - name: id\n    type: long'
    expect(readAvro(source, '1.9.0', 'yaml').nodes[0]?.children).toStrictEqual([{ name: 'id', type: 'long' }])
    expect(() => readAvro(source, '1.9.0', 'json')).toThrow()
    expect(() => readAvro('type: !include external.avsc', '1.9.0', 'yaml')).toThrow()
    expect(() => readAvro('type: string\ntype: int', '1.9.0', 'yaml')).toThrow()
  })
  it('deduplicates recursive union references even when a named type uses a complex-type keyword', () => {
    expect(() =>
      readAvro({
        type: 'record',
        name: 'example.record',
        fields: [{ name: 'next', type: ['null', 'record', 'example.record'] }],
      }),
    ).toThrow()
  })
})

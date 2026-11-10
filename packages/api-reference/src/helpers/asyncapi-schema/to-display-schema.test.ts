import { schemaRecursiveTarget } from '@scalar/blocks/schema'
// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { toDisplaySchema } from './to-display-schema'
import type { SchemaNode } from './types'

describe('to-display-schema', () => {
  it('keeps display annotations from changing field structure', () => {
    const details = ['Required', 'Repeated', 'Recursive reference', 'Optional (explicit presence)']
    expect(toDisplaySchema({ name: 'value', type: 'string', details })).toStrictEqual({
      type: 'string',
      description: details.join('\n\n'),
    })
    expect(
      toDisplaySchema({
        name: 'Record',
        type: 'object',
        children: [{ name: 'value', type: 'string', details: ['Required'] }],
      }),
    ).toStrictEqual({ type: 'object', properties: { value: { type: 'string', description: 'Required' } } })
  })

  it('uses typed enum symbols independently of annotation wording', () => {
    expect(
      toDisplaySchema({ name: 'State', type: 'enum State', symbols: ['READY'], details: ['Symbols: OTHER'] }),
    ).toStrictEqual({ type: 'string', format: 'enum State', enum: ['READY'], description: 'Symbols: OTHER' })
  })

  it('preserves Markdown code spans in descriptions and enum documentation', () => {
    expect(toDisplaySchema({ name: 'value', type: 'string', description: '`map<string, Foo>`' }).description).toBe(
      '`map<string, Foo>`',
    )
    expect(
      toDisplaySchema({
        name: 'State',
        type: 'enum State',
        children: [{ name: 'READY', type: '0', description: '`map<string, Foo>`' }],
      })['x-enum-descriptions'],
    ).toStrictEqual(['READY: `map<string, Foo>`'])
  })

  it('renders Avro enum symbols once while preserving authored documentation', () => {
    expect(
      toDisplaySchema({
        name: 'State',
        type: 'enum State',
        description: 'Current state.',
        symbols: ['READY', 'DONE'],
      }),
    ).toStrictEqual({ type: 'string', format: 'enum State', description: 'Current state.', enum: ['READY', 'DONE'] })
  })

  it('projects deeply nested oneof messages without revisiting ordinary descendants', () => {
    let reads = 0
    let node: SchemaNode = {
      name: 'leaf',
      type: 'string',
      get description() {
        reads++
        return 'Leaf documentation'
      },
    }
    for (let depth = 0; depth < 12; depth++) {
      node = {
        name: `level${depth}`,
        type: 'message Nested',
        children: [node, { name: 'choice', type: 'string', oneofGroup: 'selection' }],
      }
    }
    const result = toDisplaySchema(node)
    expect(reads).toBe(1)
    expect(JSON.stringify(result)).toContain('Leaf documentation')
  })

  it('uses standard object rows and required markers without changing reader defaults into optionality', () => {
    expect(
      toDisplaySchema({
        name: 'Schema',
        type: 'record User',
        children: [
          { name: 'id', type: 'long', readerDefault: 0 },
          { name: 'email', type: 'string', required: true },
        ],
      }),
    ).toStrictEqual({
      type: 'object',
      properties: {
        id: { type: 'integer', format: 'long', default: 0 },
        email: { type: 'string' },
      },
      required: ['email'],
    })
  })

  it('uses the shared array and composition controls', () => {
    expect(
      toDisplaySchema({
        name: 'labels',
        type: 'array',
        children: [
          {
            name: 'Items',
            type: 'union',
            children: [
              { name: 'Variant 1', type: 'string' },
              { name: 'Variant 2', type: 'nil' },
            ],
          },
        ],
      }),
    ).toStrictEqual({ type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'null' }] } })
    expect(toDisplaySchema({ name: 'ids', type: 'int64', repeated: true, details: ['Field number: 1'] })).toStrictEqual(
      {
        type: 'array',
        description: 'Field number: 1',
        items: { type: 'integer', format: 'int64' },
      },
    )
  })

  it('keeps repeated recursive references as arrays', () => {
    expect(toDisplaySchema({ name: 'children', type: 'message User', repeated: true, recursive: true })).toStrictEqual({
      type: 'array',
      [schemaRecursiveTarget]: 'User',
      items: { type: 'object', title: 'message User', [schemaRecursiveTarget]: 'User' },
    })
  })

  it('keeps recursive references as object leaves and maps as dictionaries', () => {
    expect(toDisplaySchema({ name: 'parent', type: 'User', recursive: true })).toStrictEqual({
      type: 'object',
      title: 'User',
      [schemaRecursiveTarget]: 'User',
    })
    expect(
      toDisplaySchema({
        name: 'counts',
        type: 'map<string, int32>',
        mapKey: 'string',
        mapValue: { name: 'Values', type: 'int32' },
        details: ['Field number: 2'],
      }),
    ).toStrictEqual({
      type: 'object',
      description: 'Field number: 2\n\nMap keys: string',
      additionalProperties: { type: 'integer', format: 'int32' },
    })
  })
})

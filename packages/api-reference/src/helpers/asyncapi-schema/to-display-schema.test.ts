import { schemaRecursiveTarget } from '@scalar/blocks/schema'
// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { toDisplaySchema } from './to-display-schema'

describe('to-display-schema', () => {
  it('uses standard object rows and required markers without changing reader defaults into optionality', () => {
    expect(
      toDisplaySchema({
        name: 'Schema',
        type: 'record User',
        children: [
          { name: 'id', type: 'long', readerDefault: 0 },
          { name: 'email', type: 'string', details: ['Required'] },
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
    expect(toDisplaySchema({ name: 'ids', type: 'int64', details: ['Field number: 1', 'Repeated'] })).toStrictEqual({
      type: 'array',
      description: 'Field number: 1',
      items: { type: 'integer', format: 'int64' },
    })
  })

  it('keeps repeated recursive references as arrays', () => {
    expect(
      toDisplaySchema({ name: 'children', type: 'message User', details: ['Repeated', 'Recursive reference'] }),
    ).toStrictEqual({
      type: 'array',
      [schemaRecursiveTarget]: 'User',
      items: { type: 'object', title: 'message User', [schemaRecursiveTarget]: 'User' },
    })
  })

  it('keeps recursive references as object leaves and maps as dictionaries', () => {
    expect(toDisplaySchema({ name: 'parent', type: 'User', details: ['Recursive reference'] })).toStrictEqual({
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

import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { isFileSchema } from './is-file-schema'

describe('is-file-schema', () => {
  it.each<{ name: string; schema: SchemaObject; expected: boolean }>([
    { name: 'binary string', schema: { type: 'string', format: 'binary' }, expected: true },
    { name: 'nullable binary string', schema: { type: ['string', 'null'], format: 'binary' }, expected: true },
    { name: 'file array', schema: { type: 'array', items: { type: 'string', format: 'binary' } }, expected: true },
    {
      name: 'nullable file array items',
      schema: {
        type: 'array',
        items: { __scalar_: '', anyOf: [{ type: 'string', format: 'binary' }, { type: 'null' }] },
      },
      expected: true,
    },
    {
      name: 'split binary intersection',
      schema: { type: 'string', allOf: [{ type: 'string' }, { __scalar_: '', format: 'binary' }] },
      expected: true,
    },
    {
      name: 'selected text alternative',
      schema: { type: 'string', oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }] },
      expected: false,
    },
    { name: 'text', schema: { type: 'string' }, expected: false },
    { name: 'integer', schema: { type: 'integer' }, expected: false },
    { name: 'boolean', schema: { type: 'boolean' }, expected: false },
    { name: 'text array', schema: { type: 'array', items: { type: 'string' } }, expected: false },
    { name: 'base64 string', schema: { type: 'string', format: 'byte' }, expected: false },
    { name: 'object', schema: { type: 'object' }, expected: false },
    { name: 'raw binary media', schema: { __scalar_: '', contentMediaType: 'image/png' }, expected: true },
    {
      name: 'encoded media',
      schema: { __scalar_: '', contentMediaType: 'image/png', contentEncoding: 'base64' },
      expected: false,
    },
    {
      name: 'annotated file',
      schema: {
        __scalar_: '',
        allOf: [
          { type: 'string', format: 'binary' },
          { __scalar_: '', description: 'A file' },
        ],
      },
      expected: true,
    },
  ])('classifies $name', ({ schema, expected }) => {
    expect(isFileSchema(schema)).toBe(expected)
  })
  it('terminates for recursive array schemas', () => {
    const schema: SchemaObject = { type: 'array' }
    schema.items = schema
    expect(isFileSchema(schema)).toBe(false)
  })
})

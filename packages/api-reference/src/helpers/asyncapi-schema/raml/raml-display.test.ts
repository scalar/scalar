// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { toDisplaySchema } from '../to-display-schema'
import { readRaml } from './raml'

describe('raml-display', () => {
  it('preserves literal question marks and required markers in the shared renderer', () => {
    const node = readRaml({ properties: { 'literal?': { required: true }, 'optional?': 'string' } }).nodes[0]!
    expect(toDisplaySchema(node)).toStrictEqual({
      type: 'object',
      properties: {
        'literal?': { type: 'string' },
        optional: { type: 'string' },
      },
      required: ['literal?'],
    })
  })

  it('retains native facets in the documentation without claiming a validation conversion', () => {
    expect(toDisplaySchema(readRaml({ type: 'datetime', format: 'rfc2616' }).nodes[0]!)).toStrictEqual({
      type: 'string',
      format: 'datetime',
      description: 'format: "rfc2616"',
    })
    expect(toDisplaySchema(readRaml({ type: 'string', enum: ['a', 'b'], minLength: 1 }).nodes[0]!)).toStrictEqual({
      type: 'string',
      description: 'enum: ["a","b"]\n\nminLength: 1',
    })
  })

  it('keeps unconstrained array items unconstrained and preserves authored Markdown', () => {
    expect(toDisplaySchema(readRaml('array').nodes[0]!)).toStrictEqual({ type: 'array', items: {} })
    expect(
      toDisplaySchema(readRaml({ type: 'string', description: '<img src=x onerror=alert(1)>' }).nodes[0]!).description,
    ).toBe('<img src=x onerror=alert(1)>')
  })
})

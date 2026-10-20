import { describe, expect, it } from 'vitest'

import { getReferenceTargets } from './get-reference-targets'

describe('get-reference-targets', () => {
  it('follows local aliases into extension storage without collecting unreferenced extension data', () => {
    expect(
      getReferenceTargets({
        properties: { foo: { $ref: '#/x-ext/Foo' } },
        'x-ext': { Foo: { $ref: 'schema.json' }, Data: { $ref: 'literal.json' } },
      }),
    ).toStrictEqual([{ filename: 'schema.json', fragment: '', context: 'schema' }])
  })

  it('terminates local reference cycles', () => {
    expect(getReferenceTargets({ properties: { self: { $ref: '#' } } })).toStrictEqual([])
  })
})

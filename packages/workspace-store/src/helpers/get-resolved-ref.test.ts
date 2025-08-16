import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { describe, expect, it } from 'vitest'

describe('get-resolved-ref', () => {
  it('should resolve a simple $ref', () => {
    const input = createMagicProxy({
      a: { $ref: '#/b' },
      b: 'hello',
    })

    expect(getResolvedRef(input.a)).toEqual('hello')
  })

  it('should resolved deeply nested $refs #1', () => {
    const input = createMagicProxy({
      a: { $ref: '#/b' },
      b: { $ref: '#/c' },
      c: 'world',
    })

    expect(getResolvedRef(input.a)).toEqual('world')
  })

  it('should resolved deeply nested $refs #2', () => {
    const input = createMagicProxy({
      a: { $ref: '#/b' },
      b: { $ref: '#/c' },
      c: { $ref: '#/d' },
      d: { $ref: '#/e' },
      e: { $ref: '#/f' },
      f: 'world',
    })

    expect(getResolvedRef(input.a)).toEqual('world')
  })

  it('should handle circular references', () => {
    const input = createMagicProxy({
      a: { $ref: '#/b' },
      b: { $ref: '#/c' },
      c: {
        prop: {
          inner: { $ref: '#/b' },
        },
      },
    })

    expect(getRaw(getResolvedRef(input.a))).toEqual({
      'prop': {
        'inner': {
          '$ref': '#/b',
        },
      },
    })
  })

  it('should handle self circular references', () => {
    const input = createMagicProxy({
      a: {
        $ref: '#/a',
      },
    })

    expect(getResolvedRef(input.a)).toEqual(undefined)
  })
})

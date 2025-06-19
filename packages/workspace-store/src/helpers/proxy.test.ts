import { createMagicProxy } from '@/helpers/proxy'
import { describe, expect, it } from 'vitest'

describe('createMagicProxy', () => {
  it('should correctly proxy internal refs', () => {
    const input = {
      a: 'hello',
      b: {
        '$ref': '#/a',
      },
    }

    const result = createMagicProxy(input)

    expect(result.b).toBe('hello')
  })

  it('should correctly proxy deep nested refs', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              prop: 'hello',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input) as any
    expect(result.a.b.c.e.prop).toBe('hello')
  })

  it('should correctly proxy multi refs', () => {
    const input = {
      a: {
        b: {
          c: {
            prop: 'hello',
          },
        },
      },
      e: {
        f: {
          $ref: '#/a/b/c/prop',
        },
      },
      d: {
        $ref: '#/e/f',
      },
    }

    const result = createMagicProxy(input)

    expect(result.d).toBe('hello')
  })

  it('should preserve information about the ref when the ref is resolved', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              prop: 'hello',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    expect(result.a.b.c.e).toEqual({
      prop: 'hello',
      'x-original-ref': '#/a/b/c/d',
    })
  })

  it('should preserve the first ref on nested refs', () => {
    const input = {
      a: {
        b: {
          c: {
            d: {
              '$ref': '#/a/b/c/f',
            },
            e: {
              '$ref': '#/a/b/c/d',
            },
            f: {
              someProp: 'test',
            },
          },
        },
      },
    }

    const result = createMagicProxy(input)
    expect(result.a.b.c.e).toEqual({
      someProp: 'test',
      'x-original-ref': '#/a/b/c/d',
    })
  })
})

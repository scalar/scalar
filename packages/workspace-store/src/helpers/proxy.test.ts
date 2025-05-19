import { createMagicProxy } from '@/helpers/proxy'
import { describe, expect, test } from 'vitest'

describe('createMagicProxy', () => {
  test('should correctly proxy internal refs', () => {
    const input = {
      a: 'hello',
      b: {
        '$ref': '#/a',
      },
    }

    const result = createMagicProxy(input)

    expect(result.b).toBe('hello')
  })

  test('should correctly proxy deep nested refs', () => {
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
      b: {
        '$ref': '#/a/b/c/e',
      },
    }

    const result = createMagicProxy(input) as any

    expect(result.b).toBe('hello')
  })
})

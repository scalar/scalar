import { describe, expect, it } from 'vitest'

import { isObject } from '@/helpers/is-object'
import {
  type Schema,
  any,
  array,
  boolean,
  evaluate,
  fn,
  intersection,
  lazy,
  literal,
  notDefined,
  nullable,
  number,
  object,
  optional,
  record,
  string,
  union,
  unknown,
} from '@/schema'
import { validate } from '@/validate'

describe('any', () => {
  const T = any()
  it('Should pass string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(true)
  })
})

describe('unknown', () => {
  const T = unknown()
  it('passes string', () => {
    expect(validate(T, 'hello')).toBe(true)
  })
  it('passes number', () => {
    expect(validate(T, 1)).toBe(true)
  })
  it('passes boolean', () => {
    expect(validate(T, true)).toBe(true)
  })
  it('passes null', () => {
    expect(validate(T, null)).toBe(true)
  })
  it('passes undefined', () => {
    expect(validate(T, undefined)).toBe(true)
  })
  it('passes object', () => {
    expect(validate(T, { a: 1 })).toBe(true)
  })
  it('passes array', () => {
    expect(validate(T, [1, 2])).toBe(true)
  })
  it('passes Date', () => {
    expect(validate(T, new Date())).toBe(true)
  })
})

describe('fn', () => {
  const T = fn()
  it('passes a named function', () => {
    function greet() {
      return 'hi'
    }
    expect(validate(T, greet)).toBe(true)
  })
  it('passes an arrow function', () => {
    expect(validate(T, () => 42)).toBe(true)
  })
  it('passes an async function', () => {
    expect(validate(T, async () => 42)).toBe(true)
  })
  it('rejects a string', () => {
    expect(validate(T, 'hello')).toBe(false)
  })
  it('rejects a number', () => {
    expect(validate(T, 123)).toBe(false)
  })
  it('rejects null', () => {
    expect(validate(T, null)).toBe(false)
  })
  it('rejects undefined', () => {
    expect(validate(T, undefined)).toBe(false)
  })
  it('rejects an object', () => {
    expect(validate(T, {})).toBe(false)
  })
  it('passes with a typed schema', () => {
    const typed = fn<(a: string) => void>()
    expect(validate(typed, (a: string) => a)).toBe(true)
  })
})

describe('array', () => {
  it('Should pass number array', () => {
    const T = array(number())
    const value = [1, 2, 3]
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail number array', () => {
    const T = array(number())
    const value = ['a', 'b', 'c']
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass object array', () => {
    const T = array(object({ x: number() }))
    const value = [{ x: 1 }, { x: 1 }, { x: 1 }]
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail object array', () => {
    const T = array(object({ x: number() }))
    const value = [{ x: 1 }, { x: 1 }, 1]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(array(any()), value)
    expect(result).toBe(false)
  })
})

describe('boolean', () => {
  const T = boolean()
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('literal', () => {
  const T = literal('hello')
  it('Should pass literal', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail literal', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail literal with undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail literal with null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('null', () => {
  const T = nullable()
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('number', () => {
  const T = number()
  it('Should not validate NaN', () => {
    const result = validate(T, Number.NaN)
    expect(result).toBe(false)
  })
  it('Should not validate +Infinity', () => {
    const result = validate(T, Number.POSITIVE_INFINITY)
    expect(result).toBe(false)
  })
  it('Should not validate -Infinity', () => {
    const result = validate(T, Number.NEGATIVE_INFINITY)
    expect(result).toBe(false)
  })
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })

  it('Should fail NaN', () => {
    const result = validate(T, Number.NaN)
    expect(result).toBe(false)
  })
})

describe('object', () => {
  const T = object({
    x: number(),
    y: number(),
    z: number(),
    a: string(),
    b: string(),
    c: string(),
  })
  it('Should pass object', () => {
    const value = {
      x: 1,
      y: 1,
      z: 1,
      a: '1',
      b: '1',
      c: '1',
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it('Should fail object with invalid property', () => {
    const value = {
      x: true,
      y: 1,
      z: 1,
      a: '1',
      b: '1',
      c: '1',
    }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object with missing property', () => {
    const value = {
      y: 1,
      z: 1,
      a: '1',
      b: '1',
      c: '1',
    }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass object with optional properties', () => {
    const T = object({
      x: optional(number()),
      y: optional(number()),
      z: optional(number()),
      a: string(),
      b: string(),
      c: string(),
    })
    const value = {
      a: '1',
      b: '1',
      c: '1',
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail object with null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object with undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })

  it('Should check for property key if property type is undefined', () => {
    const T = object({ x: notDefined() })
    expect(validate(T, { x: undefined })).toBe(true)
    expect(validate(T, {})).toBe(true)
  })
  it('Should check for property key if property type extends undefined', () => {
    const T = object({ x: union([number(), notDefined()]) })
    expect(validate(T, { x: 1 })).toBe(true)
    expect(validate(T, { x: undefined })).toBe(true)
    expect(validate(T, {})).toBe(true)
  })
  it('Should not check for property key if property type is undefined and optional', () => {
    const T = object({ x: optional(notDefined()) })
    expect(validate(T, { x: undefined })).toBe(true)
    expect(validate(T, {})).toBe(true)
  })
  it('Should not check for property key if property type extends undefined and optional', () => {
    const T = object({ x: optional(union([number(), notDefined()])) })
    expect(validate(T, { x: 1 })).toBe(true)
    expect(validate(T, { x: undefined })).toBe(true)
    expect(validate(T, {})).toBe(true)
  })
  it('Should check undefined for optional property of number', () => {
    const T = object({ x: optional(number()) })
    expect(validate(T, { x: 1 })).toBe(true)
    expect(validate(T, { x: undefined })).toBe(true) // allowed by default
    expect(validate(T, {})).toBe(true)
  })
  it('Should check undefined for optional property of undefined', () => {
    const T = object({ x: optional(notDefined()) })
    expect(validate(T, { x: 1 })).toBe(false)
    expect(validate(T, {})).toBe(true)
    expect(validate(T, { x: undefined })).toBe(true)
  })
})

describe('record', () => {
  it('Should pass record', () => {
    const T = record(
      string(),
      object({
        x: number(),
        y: number(),
        z: number(),
      }),
    )
    const value = {
      position: {
        x: 1,
        y: 2,
        z: 3,
      },
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail record with Date', () => {
    const T = record(string(), string())
    const result = validate(T, new Date())
    expect(result).toBe(false)
  })
  it('Should fail record with Uint8Array', () => {
    const T = record(string(), string())
    const result = validate(T, new Uint8Array())
    expect(result).toBe(false)
  })
  it('Should fail record with missing property', () => {
    const T = record(
      string(),
      object({
        x: number(),
        y: number(),
        z: number(),
      }),
    )
    const value = {
      position: {
        x: 1,
        y: 2,
      },
    }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail record with invalid property', () => {
    const T = record(
      string(),
      object({
        x: number(),
        y: number(),
        z: number(),
      }),
    )
    const value = {
      position: {
        x: 1,
        y: 2,
        z: '3',
      },
    }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass record with optional property', () => {
    const T = record(
      string(),
      object({
        x: number(),
        y: number(),
        z: optional(number()),
      }),
    )
    const value = {
      position: {
        x: 1,
        y: 2,
      },
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should pass record with optional property', () => {
    const T = record(
      string(),
      object({
        x: number(),
        y: number(),
        z: optional(number()),
      }),
    )
    const value = {
      position: {
        x: 1,
        y: 2,
      },
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it('Should validate for any keys', () => {
    const T = record(any(), nullable())
    const R = validate(T, {
      a: null,
      b: null,
      0: null,
      1: null,
    })
    expect(R).toBe(true)
  })

  // TODO: implement this
  it.skip('Should pass record with number key', () => {
    // @ts-expect-error - number key is not supported yet
    const T = record(number(), string())
    const value = {
      0: 'a',
      1: 'a',
      2: 'a',
    }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it.skip('Should not pass record with invalid number key', () => {
    // @ts-expect-error - number key is not supported yet
    const T = record(number(), string())
    const value = {
      a: 'a',
      1: 'a',
      2: 'a',
    }
    const result = validate(T, value)
    expect(result).toBe(false)
  })

  it.skip('Should validate for number keys', () => {
    // @ts-expect-error - number key is not supported yet
    const T = record(number(), nullable())
    const R1 = validate(T, {
      a: null,
      b: null,
      0: null,
      1: null,
    })
    const R2 = validate(T, {
      0: null,
      1: null,
    })
    expect(R1).toBe(false)
    expect(R2).toBe(true)
  })
})

describe('string', () => {
  const T = string()
  it('Should pass string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('union', () => {
  const A = object({
    type: literal('A'),
    x: number(),
    y: number(),
  })

  const B = object({
    type: literal('B'),
    x: boolean(),
    y: boolean(),
  })

  const T = union([A, B])

  it('Should pass union A', () => {
    const value = { type: 'A', x: 1, y: 1 }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it('Should pass union B', () => {
    const value = { type: 'B', x: true, y: false }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it('Should fail union A', () => {
    const value = { type: 'A', x: true, y: false }
    const result = validate(T, value)
    expect(result).toBe(false)
  })

  it('Should fail union B', () => {
    const value = { type: 'B', x: 1, y: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })

  it('Should pass union A with optional properties', () => {
    const A = object({
      type: literal('A'),
      x: optional(number()),
      y: optional(number()),
    })
    const B = object({
      type: literal('B'),
      x: boolean(),
      y: boolean(),
    })
    const T = union([A, B])
    const value = { type: 'A' }
    const result = validate(T, value)
    expect(result).toBe(true)
  })

  it('Should fail union A with invalid optional properties', () => {
    const A = object({
      type: literal('A'),
      x: optional(number()),
      y: optional(number()),
    })
    const B = object({
      type: literal('B'),
      x: boolean(),
      y: boolean(),
    })
    const T = union([A, B])
    const value = { type: 'A', x: true, y: false }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('intersection', () => {
  it('passes when the value satisfies every member object schema', () => {
    const T = intersection([object({ a: number(), b: number() }), object({ c: string(), d: string() })])
    expect(validate(T, { a: 1, b: 2, c: 'x', d: 'y' })).toBe(true)
  })

  it('fails when one member object schema fails', () => {
    const T = intersection([object({ a: number(), b: number() }), object({ c: string(), d: string() })])
    expect(validate(T, { a: 1, b: 2, c: 'x', d: 3 })).toBe(false)
  })

  it('fails when the first member fails even if later members would pass', () => {
    const T = intersection([object({ x: literal(1) }), object({ y: string() })])
    expect(validate(T, { x: 2, y: 'ok' })).toBe(false)
  })

  it('requires overlapping keys to satisfy every arm that declares them', () => {
    const T = intersection([object({ id: number() }), object({ id: string() })])
    expect(validate(T, { id: 1 })).toBe(false)
    expect(validate(T, { id: '1' })).toBe(false)
  })

  it('rejects non-plain objects before member checks', () => {
    const T = intersection([object({ x: number() }), object({ y: number() })])
    expect(validate(T, null)).toBe(false)
    expect(validate(T, undefined)).toBe(false)
    expect(validate(T, 0)).toBe(false)
    expect(validate(T, [])).toBe(false)
    expect(validate(T, new Date())).toBe(false)
  })

  it('treats an empty intersection as vacuously valid', () => {
    const T = intersection([])
    expect(validate(T, null)).toBe(true)
    expect(validate(T, { a: 1 })).toBe(true)
  })

  it('matches a single member the same as that object schema alone', () => {
    const O = object({ x: number() })
    const T = intersection([O])
    expect(validate(T, { x: 1 })).toBe(true)
    expect(validate(T, {})).toBe(false)
    expect(validate(O, { x: 1 })).toBe(validate(T, { x: 1 }))
  })

  it('validates members that use lazy schemas', () => {
    const T = intersection([object({ a: number() }), object({ nested: lazy(() => object({ z: string() })) })])
    expect(validate(T, { a: 1, nested: { z: 'ok' } })).toBe(true)
    expect(validate(T, { a: 1, nested: { z: 1 } })).toBe(false)
  })

  it('validates nested intersection members recursively', () => {
    const extensions = intersection([object({ env: optional(string()) }), object({ order: optional(number()) })], {
      typeName: 'Extensions',
    })
    const document = intersection([
      object({
        openapi: literal('3.1.0'),
        info: object({ title: string(), version: string() }),
      }),
      object({ navigation: optional(boolean()) }),
      extensions,
    ])

    expect(
      validate(document, {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        navigation: true,
        env: 'staging',
        order: 1,
      }),
    ).toBe(true)
    expect(
      validate(document, {
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        navigation: true,
        order: 'not-a-number',
      }),
    ).toBe(false)
    expect(
      validate(document, {
        openapi: '3.0.0',
        info: { title: 'API', version: '1.0.0' },
        env: 'staging',
      }),
    ).toBe(false)
  })

  it('fails nested intersection when a deeply nested member rejects the value', () => {
    const inner = intersection([object({ a: number() }), object({ b: string() })])
    const outer = intersection([object({ c: boolean() }), inner])
    expect(validate(outer, { a: 1, b: 'ok', c: true })).toBe(true)
    expect(validate(outer, { a: 1, b: 1, c: true })).toBe(false)
  })

  it('re-validates a shared member schema across union branches that reuse it', () => {
    // Both intersection branches share the same `base` schema reference. If the
    // cycle-detection cache leaks across branches, branch 1's failed visit of
    // `base` would short-circuit branch 2 into accepting an invalid value.
    const base = object({ kind: string() })
    const objA = object({ a: number() })
    const objB = object({ b: number() })

    const T = union([intersection([base, objA]), intersection([base, objB])])

    expect(validate(T, { kind: 'a', a: 1 })).toBe(true)
    expect(validate(T, { kind: 'b', b: 1 })).toBe(true)
    // Missing `kind` so `base` must fail in both branches. Previously this
    // returned `true` because branch 1 left a stale `(value, base)` entry in
    // the cache that branch 2 mistook for a successful cycle short-circuit.
    expect(validate(T, { b: 1 })).toBe(false)
    expect(validate(T, { a: 1 })).toBe(false)
  })

  it('rejects a value when every union branch fails on a shared member schema', () => {
    const base = object({ kind: string() })
    const T = union([intersection([base, object({ a: number() })]), intersection([base, object({ b: number() })])])

    expect(validate(T, { a: 1, b: 1 })).toBe(false)
    expect(validate(T, {})).toBe(false)
  })
})

describe('notDefined', () => {
  const T = notDefined()
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should pass undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('evaluate', () => {
  const T = evaluate((value) => value, number())
  it('Should pass number', () => {
    const value = 1
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail object', () => {
    const value = { a: 1 }
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('lazy', () => {
  const T = lazy(() => object({ x: number() }))
  it('Should pass object', () => {
    const value = { x: 1 }
    const result = validate(T, value)
    expect(result).toBe(true)
  })
  it('Should fail string', () => {
    const value = 'hello'
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail boolean', () => {
    const value = true
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail null', () => {
    const value = null
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail undefined', () => {
    const value = undefined
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail array', () => {
    const value = [1, 2]
    const result = validate(T, value)
    expect(result).toBe(false)
  })
  it('Should fail Date', () => {
    const value = new Date()
    const result = validate(T, value)
    expect(result).toBe(false)
  })
})

describe('cyclic structures', () => {
  it('terminates on a self-referential value paired with a recursive lazy schema', () => {
    type Node = { name: string; child?: Node }
    const T: ReturnType<typeof lazy> = lazy(() => object({ name: string(), child: optional(T) }))

    const node: Node = { name: 'root' }
    node.child = node

    expect(() => validate(T, node)).not.toThrow()
    expect(validate(T, node)).toBe(true)
  })

  it('still rejects a cyclic value when a property fails validation', () => {
    type Node = { name: unknown; child?: Node }
    const T: ReturnType<typeof lazy> = lazy(() => object({ name: string(), child: optional(T) }))

    const node: Node = { name: 42 }
    node.child = node

    expect(validate(T, node)).toBe(false)
  })

  it('terminates on mutually-recursive lazy schemas with cyclic data', () => {
    type A = { kind: 'a'; next?: B }
    type B = { kind: 'b'; next?: A }
    const SchemaA: ReturnType<typeof lazy> = lazy(() => object({ kind: literal('a'), next: optional(SchemaB) }))
    const SchemaB: ReturnType<typeof lazy> = lazy(() => object({ kind: literal('b'), next: optional(SchemaA) }))

    const a: A = { kind: 'a' }
    const b: B = { kind: 'b' }
    a.next = b
    b.next = a

    expect(() => validate(SchemaA, a)).not.toThrow()
    expect(validate(SchemaA, a)).toBe(true)
  })

  it('terminates on a self-referential array paired with a recursive lazy schema', () => {
    const T: ReturnType<typeof lazy> = lazy(() => array(lazy(() => T)))

    const arr: unknown[] = []
    arr.push(arr)

    expect(() => validate(T, arr)).not.toThrow()
    expect(validate(T, arr)).toBe(true)
  })
})

describe('memoization', () => {
  /** Counts how often the recursive schema is expanded, which is how much work validation did. */
  let expansions = 0

  /** A recursive union with no discriminator: both branches look at `next` before anything else. */
  const node: Schema = lazy(() => {
    expansions++
    return union([object({ next: optional(node), a: string() }), object({ next: optional(node), b: string() })])
  })

  /** Builds `depth` nested nodes whose innermost node matches neither branch. */
  const buildFailingChain = (depth: number): Record<string, unknown> => {
    let value: Record<string, unknown> = {}
    for (let i = 0; i < depth; i++) {
      value = { next: value, a: 'x' }
    }
    return value
  }

  it('validates an undiscriminated recursive union in linear time', () => {
    // Every level fails in the first branch and is then tried again in the second one. Without the
    // memo that doubles the work per level. The depths stay small so a regression fails quickly
    // instead of hanging: at depth 20 that is still about two million expansions.
    const countExpansions = (depth: number): number => {
      expansions = 0
      expect(validate(node, buildFailingChain(depth))).toBe(false)
      return expansions
    }

    expect(countExpansions(10)).toBe(11)
    expect(countExpansions(20)).toBe(21)
  })

  it('keeps memoizing after a cycle elsewhere in the same value', () => {
    // The cycle through `self` must only keep the frames around it out of the memo. The chain next
    // to it is still validated once per level.
    const Root: Schema = lazy(() => object({ self: optional(Root), chain: node }))
    const root: Record<string, unknown> = { chain: buildFailingChain(16) }
    root.self = root

    expansions = 0
    expect(validate(Root, root)).toBe(false)
    expect(expansions).toBeLessThan(50)
  })

  it('still accepts a valid deep chain', () => {
    let value: Record<string, unknown> = { b: 'leaf' }
    for (let i = 0; i < 200; i++) {
      value = { next: value, a: 'x' }
    }

    expect(validate(node, value)).toBe(true)
  })

  it('gives a shared node the same answer on every path that reaches it', () => {
    // Parsed documents are trees, but cloning keeps shared objects shared, so the same object can
    // sit under several parents. It must fail everywhere it is invalid.
    const T: Schema = lazy(() => object({ name: string(), left: optional(T), right: optional(T) }))
    const shared = { name: 42 }
    const value = { name: 'root', left: { name: 'l', right: shared }, right: shared }

    expect(validate(T, shared)).toBe(false)
    expect(validate(T, value)).toBe(false)
    expect(validate(T, { name: 'root', left: { name: 'l' }, right: { name: 'r' } })).toBe(true)
  })

  it('does not remember an answer that only held because of a cycle', () => {
    // `x` and `y` point at each other. Checking `x` against `S` reaches `y` against `S2`, which leads
    // back to `x` against `S` while that is still in flight, so it holds for now. `S` then fails on
    // `bad`. The second branch `W` checks `y` against `S2` again, this time without `x` against `S`
    // in flight, and must find that it fails. Remembering the first answer would accept `x`.
    const S: Schema = lazy(() => object({ y: S2, bad: optional(string()) }))
    const S2: Schema = lazy(() => object({ x: S }))
    const W = object({ y: S2 })

    const x: Record<string, unknown> = { bad: 5 }
    const y = { x }
    x.y = y

    expect(validate(W, x)).toBe(false)
    expect(validate(union([S, W]), x)).toBe(false)
  })

  it('passes pairs a caller lists as already being validated, without changing the list', () => {
    const T = object({ a: number() })
    const value = { a: 'one' }
    const cache = new WeakMap<object, Set<Schema>>([[value, new Set<Schema>([T])]])

    expect(validate(T, value, cache)).toBe(true)
    expect(validate(T, value)).toBe(false)
    expect([...(cache.get(value) ?? [])]).toEqual([T])
  })

  it('does not reuse results between calls', () => {
    const T = object({ a: number() })
    const value: Record<string, unknown> = { a: 'one' }

    expect(validate(T, value)).toBe(false)
    value.a = 1
    expect(validate(T, value)).toBe(true)
  })
})

describe('schema cycles on primitives', () => {
  // A schema can point back at itself without moving to a different value. For primitives nothing
  // on the value side breaks that loop, so these used to overflow the stack.
  const T: Schema = lazy(() => union([T, string()]))

  it('accepts a primitive that another branch matches', () => {
    expect(validate(T, 's')).toBe(true)
  })

  it('rejects a primitive that no branch matches', () => {
    expect(validate(T, 7)).toBe(false)
    expect(validate(T, null)).toBe(false)
    expect(validate(T, undefined)).toBe(false)
  })

  it('rejects a value that is not a plain object', () => {
    expect(validate(T, new Date())).toBe(false)
  })

  it('keeps accepting an object on a schema cycle, as before', () => {
    // Objects and arrays are caught by the value cycle guard first, which answers `true`.
    const WithObject: Schema = lazy(() => union([WithObject, object({ a: string() })]))

    expect(validate(WithObject, {})).toBe(true)
    expect(validate(T, [])).toBe(true)
  })

  it('handles a cycle through optional', () => {
    const O: Schema = lazy(() => optional(union([O, number()])))

    expect(validate(O, 1)).toBe(true)
    expect(validate(O, undefined)).toBe(true)
    expect(validate(O, 'one')).toBe(false)
  })

  it('handles a cycle through an evaluate that returns its input', () => {
    // A `$ref` resolver returns anything that is not a reference unchanged.
    const E: Schema = lazy(() => union([evaluate((value) => value, E), string()]))

    expect(validate(E, 's')).toBe(true)
    expect(validate(E, 7)).toBe(false)
  })

  it('follows an evaluate that changes the value', () => {
    const E: Schema = lazy(() =>
      union([evaluate((value) => (typeof value === 'number' ? String(value) : value), E), string()]),
    )

    expect(validate(E, 7)).toBe(true)
    expect(validate(E, true)).toBe(false)
  })

  it('handles a cycle through an evaluate that swaps between two values', () => {
    const swapped = new Map<unknown, unknown>([
      [1, 2],
      [2, 1],
    ])
    const swap = (value: unknown): unknown => (swapped.has(value) ? swapped.get(value) : value)
    const withoutMatch: Schema = lazy(() => union([evaluate(swap, withoutMatch), string()]))
    const withMatch: Schema = lazy(() => union([evaluate(swap, withMatch), literal(2)]))

    expect(validate(withoutMatch, 1)).toBe(false)
    expect(validate(withMatch, 1)).toBe(true)
  })

  it('finds a match in a later branch after an earlier branch looped', () => {
    // The first branch moves on from `1` to `2` and loops there. The second branch loops straight
    // back on `1`. Only the last branch decides.
    const step = (value: unknown): unknown => (value === 1 ? 2 : value)
    const withoutMatch: Schema = lazy(() => union([evaluate(step, withoutMatch), withoutMatch, literal(3)]))
    const withMatch: Schema = lazy(() => union([evaluate(step, withMatch), withMatch, literal(1)]))

    expect(validate(withoutMatch, 1)).toBe(false)
    expect(validate(withMatch, 1)).toBe(true)
  })

  it('checks a schema that reuses the same branch many times once per branch', () => {
    // Each level offers the level below twice, so there are 2^20 paths down to `string()`.
    let expansions = 0
    let schema: Schema = string()
    for (let level = 0; level < 20; level++) {
      const below: Schema = schema
      schema = lazy((): Schema => {
        expansions++
        return union([optional(below), optional(below)])
      })
    }

    expect(validate(schema, 's')).toBe(true)
    expect(validate(schema, 7)).toBe(false)
    expect(expansions).toBeLessThan(1_000)
  })

  it('checks a property value against a schema its parent already used', () => {
    // Moving into a property is a new value, so the guard starts over there.
    const P: Schema = lazy(() => union([object({ a: P }), number()]))

    expect(validate(P, { a: 1 })).toBe(true)
    expect(validate(P, { a: { a: 2 } })).toBe(true)
    expect(validate(P, { a: 's' })).toBe(false)
  })
})

describe('memoization parity', () => {
  /**
   * The validator as it was before memoization, kept here as the reference to compare against.
   * That version overflowed the stack when a schema looped on a value that is not an object or
   * array. Here it gets the simplest possible guard for that instead: a loop on the current path
   * does not count as a match, and the path starts over at every object or array. It remembers
   * nothing, so any difference points at the memo or at the shortcuts the real search takes.
   */
  const referenceValidate = (
    schema: Schema | undefined,
    value: unknown,
    cache: WeakMap<object, Set<Schema>> = new WeakMap(),
    path: Map<unknown, Set<Schema>> = new Map(),
  ): boolean => {
    if (!schema) {
      return false
    }
    const trackable = isObject(value) || Array.isArray(value)
    if (trackable && cache.get(value)?.has(schema)) {
      return true
    }
    if (trackable) {
      const schemas = cache.get(value) ?? new Set<Schema>()
      schemas.add(schema)
      cache.set(value, schemas)
    }

    const loops =
      !trackable &&
      (schema.type === 'union' || schema.type === 'optional' || schema.type === 'lazy' || schema.type === 'evaluate')
    if (loops && path.get(value)?.has(schema)) {
      return false
    }
    if (loops) {
      path.set(value, (path.get(value) ?? new Set<Schema>()).add(schema))
    }

    /** Moves on to another check. The path only carries on between values that are not objects or arrays. */
    const next = (s: Schema | undefined, v: unknown): boolean =>
      referenceValidate(s, v, cache, loops && !isObject(v) && !Array.isArray(v) ? path : new Map())
    const check = (): boolean => {
      switch (schema.type) {
        case 'any':
        case 'unknown':
          return true
        case 'function':
          return typeof value === 'function'
        case 'number':
          return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
        case 'string':
          return typeof value === 'string'
        case 'boolean':
          return typeof value === 'boolean'
        case 'nullable':
          return value === null
        case 'notDefined':
          return value === undefined
        case 'array':
          return Array.isArray(value) && value.every((item) => next(schema.items, item))
        case 'record':
          return (
            isObject(value) &&
            Object.keys(value).every((key) => next(schema.key, key) && next(schema.value, value[key]))
          )
        case 'object':
          return (
            isObject(value) && Object.keys(schema.properties).every((key) => next(schema.properties[key], value[key]))
          )
        case 'optional':
          return value === undefined || next(schema.schema, value)
        case 'union':
          return schema.schemas.some((branch) => next(branch, value))
        case 'intersection':
          return (
            schema.schemas.length === 0 || (isObject(value) && schema.schemas.every((member) => next(member, value)))
          )
        case 'literal':
          return value === schema.value
        case 'lazy':
          return next(schema.schema(), value)
        case 'evaluate':
          return next(schema.schema, schema.expression(value))
      }
    }

    // No `try`/`finally` here: a thrown error ends the whole comparison, so the markers do not matter then.
    const result = check()
    if (trackable) {
      cache.get(value)?.delete(schema)
    }
    if (loops) {
      path.get(value)?.delete(schema)
    }
    return result
  }

  /** Small seeded generator (mulberry32), so a failure can be reproduced from its seed. */
  const createRandom = (seed: number): { int: (max: number) => number; pick: <T>(items: readonly T[]) => T } => {
    let state = seed >>> 0
    const next = (): number => {
      state = (state + 0x6d2b79f5) >>> 0
      let t = state
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const int = (max: number): number => Math.floor(next() * max)
    const pick = <T>(items: readonly T[]): T => items[int(items.length)] as T
    return { int, pick }
  }

  const KEYS = ['a', 'b'] as const
  const PRIMITIVES = ['a', 'x', 1, 2, null, true] as const

  /**
   * Pure expressions for `evaluate`: one returns its input, the others step to a different value.
   * The counter keeps stepping between primitives, so it can close a loop through several values.
   */
  const EXPRESSIONS: readonly ((value: unknown) => unknown)[] = [
    (value) => value,
    (value) => (isObject(value) ? value.a : value),
    (value) => (value === 1 ? 'a' : value),
    (value) => (typeof value === 'number' ? (value + 1) % 4 : value),
  ]

  /** Builds a set of mutually recursive schemas and returns the first one. */
  const buildSchema = (random: ReturnType<typeof createRandom>): Schema => {
    const definitions: Schema[] = []
    const slots: Schema[] = [0, 1, 2].map((index) => lazy(() => definitions[index] as Schema))

    const build = (depth: number): Schema => {
      const kind = random.int(depth >= 3 ? 3 : 12)
      switch (kind) {
        case 0:
          return random.pick([string(), number(), nullable(), boolean(), literal('a'), literal(1)])
        case 1:
        case 2:
          return random.pick(slots)
        case 3:
        case 4: {
          const properties: Record<string, Schema> = {}
          for (const key of KEYS) {
            if (random.int(2) === 0) {
              properties[key] = random.int(2) === 0 ? optional(build(depth + 1)) : build(depth + 1)
            }
          }
          return object(properties)
        }
        case 5:
          return optional(build(depth + 1))
        case 6:
        case 7:
          return union(Array.from({ length: 2 + random.int(2) }, () => build(depth + 1)) as never)
        case 8:
          return intersection([build(depth + 1), build(depth + 1)] as never)
        case 9:
          return array(build(depth + 1))
        case 10:
          return record(string(), build(depth + 1))
        default:
          return evaluate(random.pick(EXPRESSIONS), build(depth + 1))
      }
    }

    for (const _ of slots) {
      definitions.push(build(0))
    }
    return slots[0] as Schema
  }

  /** Builds a small graph of objects and arrays whose references can point anywhere, including back up. */
  const buildValue = (random: ReturnType<typeof createRandom>): unknown => {
    const nodes: (Record<string, unknown> | unknown[])[] = Array.from({ length: 1 + random.int(3) }, () =>
      random.int(4) === 0 ? [] : {},
    )
    const pickValue = (): unknown => (random.int(2) === 0 ? random.pick(nodes) : random.pick(PRIMITIVES))

    for (const node of nodes) {
      if (Array.isArray(node)) {
        const length = random.int(3)
        for (let index = 0; index < length; index++) {
          node.push(pickValue())
        }
      } else {
        for (const key of KEYS) {
          if (random.int(4) !== 0) {
            node[key] = pickValue()
          }
        }
      }
    }
    return random.int(6) === 0 ? random.pick(PRIMITIVES) : nodes[0]
  }

  it('matches the unmemoized validator on random cyclic values and looping schemas', () => {
    let compared = 0
    let rejected = 0

    for (let seed = 1; seed <= 10_000; seed++) {
      const random = createRandom(seed)
      const schema = buildSchema(random)
      const value = buildValue(random)

      const expected = referenceValidate(schema, value)

      compared++
      if (!expected) {
        rejected++
      }
      expect(validate(schema, value), `seed ${seed}`).toBe(expected)
    }

    // Make sure the generator really exercises both answers instead of passing on trivial cases.
    expect(compared).toBeGreaterThan(9_000)
    expect(rejected).toBeGreaterThan(1_000)
    expect(compared - rejected).toBeGreaterThan(1_000)
  })
})

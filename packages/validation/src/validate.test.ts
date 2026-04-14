import { describe, expect, it } from 'vitest'

import {
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

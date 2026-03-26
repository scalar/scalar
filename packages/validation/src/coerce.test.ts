import { describe, expect, it } from 'vitest'

import { coerce } from '@/coerce'
import {
  any,
  array,
  boolean,
  evaluate,
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
} from '@/schema'

describe('any', () => {
  const T = any()
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from boolean', () => {
    const value = false
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
  it('Should preserve', () => {
    const value = { a: 1, b: 2 }
    const result = coerce(T, value)
    expect(result).toEqual({ a: 1, b: 2 })
  })
})

describe('array', () => {
  const T = array(number())
  const E: number[] = []
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual([1])
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve', () => {
    const value = [6, 7, 8]
    const result = coerce(T, value)
    expect(result).toEqual([6, 7, 8])
  })
})

describe('boolean', () => {
  const T = boolean()
  const E = false
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from number', () => {
    const value = 0
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toBe(true)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preserve', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toBe(true)
  })
})

describe('literal', () => {
  const T = literal('hello')
  const E = 'hello'
  it('Should upcast from string', () => {
    const value = 'world'
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preseve', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toBe('hello')
  })
})

describe('null', () => {
  const T = nullable()
  const E = null
  it('Should upcast from string', () => {
    const value = 'world'
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preseve', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(null)
  })
})

describe('number', () => {
  const T = number()
  const E = 0
  it('Should upcast from string', () => {
    const value = 'world'
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toBe(1)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preseve', () => {
    const value = 123
    const result = coerce(T, value)
    expect(result).toBe(123)
  })
})

describe('object', () => {
  const T = object({
    a: number(),
    b: number(),
    c: number(),
    x: number(),
    y: number(),
    z: number(),
  })
  const E = {
    x: 0,
    y: 0,
    z: 0,
    a: 0,
    b: 0,
    c: 0,
  }
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = E
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve', () => {
    const value = { x: 7, y: 8, z: 9, a: 10, b: 11, c: 12 }
    const result = coerce(T, value)
    expect(result).toEqual({
      x: 7,
      y: 8,
      z: 9,
      a: 10,
      b: 11,
      c: 12,
    })
  })
  it('Should upcast partial object with incorrect properties', () => {
    const value = { x: {}, y: 8, z: 9 }
    const result = coerce(T, value)
    expect(result).toEqual({
      x: 0,
      y: 8,
      z: 9,
      a: 0,
      b: 0,
      c: 0,
    })
  })
  it('Should upcast and preserve partial object and omit unknown properties', () => {
    const value = { x: 7, y: 8, z: 9, unknown: 'foo' }
    const result = coerce(T, value)
    expect(result).toEqual({
      x: 7,
      y: 8,
      z: 9,
      a: 0,
      b: 0,
      c: 0,
    })
  })
  it('Should upcast and remove additional properties', () => {
    const result = coerce(
      object({
        x: number(),
        y: number(),
      }),
      {
        x: 1,
        y: 2,
        z: { b: 1 },
      },
    )
    expect(result).toEqual({
      x: 1,
      y: 2,
    })
  })
})

describe('record', () => {
  const T = record(
    string(),
    object({
      x: number(),
      y: number(),
      z: number(),
    }),
  )
  const E = {}
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = E
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve', () => {
    const value = {
      a: { x: 1, y: 2, z: 3 },
      b: { x: 4, y: 5, z: 6 },
    }
    const result = coerce(T, value)
    expect(result).toEqual(value)
  })
  it('Should preserve and patch invalid records', () => {
    const value = {
      a: { x: 1, y: 2, z: 3 },
      b: { x: 4, y: 5, z: {} },
      c: [1, 2, 3],
      d: 1,
      e: { x: 1, y: 2, w: 9000 },
    }
    const result = coerce(T, value)
    expect(result).toEqual({
      a: { x: 1, y: 2, z: 3 },
      b: { x: 4, y: 5, z: 0 },
      c: { x: 0, y: 0, z: 0 },
      d: { x: 0, y: 0, z: 0 },
      e: { x: 1, y: 2, z: 0 },
    })
  })
})

describe('string', () => {
  const T = string()
  const E = ''
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toBe('hello')
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preserve', () => {
    const value = 'foo'
    const result = coerce(T, value)
    expect(result).toBe(value)
  })
})

describe('union', () => {
  const A = object({
    type: literal('A'),
    x: number(),
    y: number(),
    z: number(),
  })
  const B = object({
    type: literal('B'),
    a: string(),
    b: string(),
    c: string(),
  })
  const T = union([A, B])
  const E = {
    type: 'A',
    x: 0,
    y: 0,
    z: 0,
  }
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve A', () => {
    const value = { type: 'A', x: 1, y: 2, z: 3 }
    const result = coerce(T, value)
    expect(result).toEqual(value)
  })
  it('Should preserve B', () => {
    const value = { type: 'B', a: 'a', b: 'b', c: 'c' }
    const result = coerce(T, value)
    expect(result).toEqual(value)
  })
  it('Should infer through heuristics #1', () => {
    const value = { type: 'A', a: 'a', b: 'b', c: 'c' }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'A', x: 0, y: 0, z: 0 })
  })
  it('Should infer through heuristics #2', () => {
    const value = { type: 'B', x: 1, y: 2, z: 3 }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'B', a: '', b: '', c: '' })
  })
  it('Should infer through heuristics #3', () => {
    const value = { type: 'A', a: 'a', b: 'b', c: null }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'A', x: 0, y: 0, z: 0 })
  })
  it('Should infer through heuristics #4', () => {
    const value = { type: 'B', x: 1, y: 2, z: {} }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'B', a: '', b: '', c: '' })
  })
  it('Should infer through heuristics #5', () => {
    const value = { type: 'B', x: 1, y: 2, z: null }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'B', a: '', b: '', c: '' })
  })
  it('Should infer through heuristics #6', () => {
    const value = { x: 1 }
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'A', x: 1, y: 0, z: 0 })
  })
  it('Should infer through heuristics #7', () => {
    const value = { a: null } // property existing should contribute
    const result = coerce(T, value)
    expect(result).toEqual({ type: 'B', a: '', b: '', c: '' })
  })
  it('should correctly score nested union types #1', () => {
    const A = union([
      union([
        object({
          type: literal('a'),
          name: string(),
          in: string(),
        }),
        object({
          type: literal('b'),
          description: optional(string()),
          nested: object({
            a: string(),
            b: optional(string()),
          }),
        }),
      ]),
      object({
        $ref: string(),
        description: optional(string()),
      }),
    ])

    expect(
      coerce(A, {
        type: 'b',
        description: 'Hello World',
        nested: {
          b: 'hello',
        },
      }),
    ).toEqual({
      type: 'b',
      description: 'Hello World',
      nested: { a: '', b: 'hello' },
    })
  })

  it('should correctly score nested union types #2', () => {
    const A = union([
      union([
        object({
          prop1: string(),
          prop2: string(),
          prop3: string(),
        }),
        object({
          prop1: string(),
          prop4: string(),
          prop5: string(),
        }),
      ]),
      union([
        object({
          prop6: string(),
          prop7: string(),
          prop8: string(),
        }),
        object({
          prop1: string(),
          prop9: string(),
          prop10: string(),
        }),
      ]),
    ])

    // Picks the first union variant when the score is equal
    expect(
      coerce(A, {
        prop1: '',
      }),
    ).toEqual({
      prop1: '',
      prop2: '',
      prop3: '',
    })

    expect(
      coerce(A, {
        prop1: '',
        prop4: '',
      }),
    ).toEqual({
      prop1: '',
      prop4: '',
      prop5: '',
    })

    expect(
      coerce(A, {
        prop6: '',
      }),
    ).toEqual({
      prop6: '',
      prop7: '',
      prop8: '',
    })
  })

  it('should correctly score nested union types #3', () => {
    const A = union([
      object({
        prop1: string(),
        prop2: string(),
        prop3: string(),
      }),
      object({
        prop4: string(),
        prop5: string(),
        prop6: string(),
      }),
      union([
        object({
          prop4: string(),
          prop5: string(),
          prop6: string(),
        }),
        object({
          prop1: string(),
          prop2: string(),
          prop7: string(),
          prop8: string(),
        }),
      ]),
    ])

    expect(
      coerce(A, {
        prop1: '',
        prop2: '',
        prop7: '',
      }),
    ).toEqual({
      prop1: '',
      prop2: '',
      prop7: '',
      prop8: '',
    })
  })

  it('should correctly score nested union types #4', () => {
    const A = union([
      object({
        prop1: string(),
        prop2: string(),
        prop3: string(),
      }),
      union([
        object({
          prop4: string(),
          prop5: string(),
          prop6: string(),
        }),
        union([
          object({
            prop1: string(),
            prop2: string(),
            prop7: string(),
            prop8: string(),
          }),
          union([
            object({
              prop1: string(),
              prop2: string(),
              prop9: string(),
              prop10: string(),
            }),
            object({
              prop1: string(),
              prop2: string(),
              prop11: string(),
              prop12: string(),
            }),
          ]),
        ]),
      ]),
    ])

    expect(
      coerce(A, {
        prop1: '',
        prop2: '',
        prop9: '',
      }),
    ).toEqual({
      prop1: '',
      prop2: '',
      prop9: '',
      prop10: '',
    })
  })

  it('should correctly score object unions with shared properties #1', () => {
    const schema = union([
      object({
        summary: optional(string()),
        description: optional(string()),
        parameters: optional(array(any())),
        responses: optional(record(string(), any())),
        requestBody: optional(any()),
      }),
      object({
        $ref: string(),
        summary: optional(string()),
      }),
    ])

    expect(
      coerce(schema, {
        summary: 'Test Summary',
        parameters: {},
      }),
    ).toEqual({
      summary: 'Test Summary',
      parameters: [],
    })
  })

  it('should correctly score object unions with shared properties #2', () => {
    const A = union([
      object({
        prop1: string(),
        prop2: string(),
        prop3: string(),
      }),
      object({
        prop1: string(),
        prop2: string(),
        prop4: string(),
        prop5: string(),
        prop6: string(),
        prop7: string(),
        prop8: string(),
        prop9: string(),
        prop10: string(),
      }),
    ])

    expect(
      coerce(A, {
        prop1: '',
        prop2: '',
        prop7: '',
      }),
    ).toEqual({
      prop1: '',
      prop2: '',
      prop4: '',
      prop5: '',
      prop6: '',
      prop7: '',
      prop8: '',
      prop9: '',
      prop10: '',
    })
  })

  it('should correctly score object union for objects with all optional properties', () => {
    const A = union([
      object({
        prop1: optional(string()),
        prop2: optional(string()),
        prop3: optional(string()),
      }),
      object({
        $ref: string(),
      }),
    ])

    expect(
      coerce(A, {
        $ref: 'https://example.com/schema',
      }),
    ).toEqual({
      $ref: 'https://example.com/schema',
    })
  })
})

describe('intersection', () => {
  const T = intersection([
    object({
      a: number(),
      b: number(),
    }),
    object({
      c: string(),
      d: string(),
    }),
  ])
  it('merges coerced properties from each object schema', () => {
    const result = coerce(T, { a: 1, b: 2, c: 'x', d: 'y' })
    expect(result).toEqual({ a: 1, b: 2, c: 'x', d: 'y' })
  })
  it('fills missing keys per branch from the same input value', () => {
    const result = coerce(T, { a: 'nope', c: 123 })
    expect(result).toEqual({ a: 0, b: 0, c: '', d: '' })
  })
  it('later branch wins on overlapping keys', () => {
    const overlap = intersection([
      object({ x: number() }),
      object({ x: string() }),
    ])
    const result = coerce(overlap, { x: 1 })
    expect(result).toEqual({ x: '' })
  })
  it('wins in a union when every member validates and summed score beats narrower members', () => {
    const A = object({ type: literal('A'), onlyA: number() })
    const B = object({ type: literal('B'), onlyB: string() })
    const both = intersection([
      object({ type: literal('A'), shared: number() }),
      object({ shared: number(), extra: string() }),
    ])
    const T = union([A, B, both])
    // Intersection merges only its declared keys; it outscores A here because both sub-objects validate.
    expect(coerce(T, { type: 'A', onlyA: 1, shared: 2, extra: 'ok' })).toEqual({
      type: 'A',
      shared: 2,
      extra: 'ok',
    })
  })
})

describe('notDefined', () => {
  const T = notDefined()
  const E = undefined
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toBe(E)
  })
  it('Should preserve', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toBe(undefined)
  })
})

describe('lazy', () => {
  const T = lazy(() => object({ x: number() }))
  const E = { x: 0 }
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve', () => {
    const value = { x: 1 }
    const result = coerce(T, value)
    expect(result).toEqual(value)
  })
})

describe('evaluate', () => {
  const T = evaluate((value) => value, object({ x: number() }))
  const E = { x: 0 }
  it('Should upcast from string', () => {
    const value = 'hello'
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from number', () => {
    const value = 1
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from boolean', () => {
    const value = true
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from object', () => {
    const value = {}
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from array', () => {
    const value = [1]
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from undefined', () => {
    const value = undefined
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from null', () => {
    const value = null
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should upcast from date', () => {
    const value = new Date(100)
    const result = coerce(T, value)
    expect(result).toEqual(E)
  })
  it('Should preserve', () => {
    const value = { x: 1 }
    const result = coerce(T, value)
    expect(result).toEqual(value)
  })
})

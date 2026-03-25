import { describe, expect, it } from 'vitest'

import {
  any,
  array,
  boolean,
  evaluate,
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
import { generateTypes } from '@/typegen'

describe('typegen', () => {
  it('emits primitives and special scalars', () => {
    expect(generateTypes(number())).toBe('number')
    expect(generateTypes(string())).toBe('string')
    expect(generateTypes(boolean())).toBe('boolean')
    expect(generateTypes(nullable())).toBe('null')
    expect(generateTypes(notDefined())).toBe('undefined')
    expect(generateTypes(any())).toBe('any')
  })

  it('emits arrays with parentheses when the item is a union', () => {
    expect(generateTypes(array(number()))).toBe('number[]')
    expect(generateTypes(array(union([number(), string()])))).toBe('(number | string)[]')
  })

  it('emits records and objects', () => {
    expect(generateTypes(record(string(), number()))).toBe('Record<string, number>')
    expect(
      generateTypes(
        object({
          id: number(),
          name: string(),
        }),
      ),
    ).toBe('{\n  id: number;\n  name: string;\n}')
    expect(generateTypes(object({}))).toBe('{}')
  })

  it('indents nested object properties', () => {
    const car = object({
      make: string(),
      model: string(),
      year: number(),
      test: object({ test: string() }),
    })
    expect(generateTypes(car)).toBe(
      '{\n  make: string;\n  model: string;\n  year: number;\n  test: {\n    test: string;\n  };\n}',
    )
  })

  it('extracts typeName into a single export and references by name', () => {
    const user = object(
      {
        id: number(),
        name: string(),
      },
      { typeName: 'User' },
    )
    expect(generateTypes(user)).toBe('export type User = {\n  id: number;\n  name: string;\n}')
  })

  it('does not duplicate named types when the same name appears multiple times', () => {
    const user = object({ id: number() }, { typeName: 'User' })
    const doc = object(
      {
        author: user,
        editor: user,
      },
      { typeName: 'Document' },
    )
    const out = generateTypes(doc)
    expect(out.match(/export type User/g)?.length).toBe(1)
    expect(out).toContain('author: User')
    expect(out).toContain('editor: User')
    expect(out).toContain('export type Document =')
  })

  it('includes typeComment as JSDoc on named exports', () => {
    const t = object({}, { typeName: 'Empty', typeComment: 'No fields.' })
    expect(generateTypes(t)).toBe('/** No fields. */\nexport type Empty = {}')
  })

  it('formats multi-line typeComment as a JSDoc block', () => {
    const t = object({}, { typeName: 'T', typeComment: 'Line 1\nLine 2' })
    expect(generateTypes(t)).toBe('/** \n * Line 1\n * Line 2\n */\nexport type T = {}')
  })

  it('ignores invalid typeName and keeps inline shape', () => {
    const bad = object({ x: number() }, { typeName: 'not-valid' })
    expect(generateTypes(bad)).toBe('{\n  x: number;\n}')
  })

  it('quotes object keys that are not valid identifiers', () => {
    expect(generateTypes(object({ 'foo-bar': string() }))).toBe('{\n  "foo-bar": string;\n}')
  })

  it('emits unions and optionals', () => {
    expect(generateTypes(union([literal(1), literal(2)]))).toBe('1 | 2')
    expect(generateTypes(optional(number()))).toBe('number | undefined')
  })

  it('emits literal bigint', () => {
    expect(generateTypes(literal(10n))).toBe('10n')
  })

  it('unwraps evaluate to the inner schema type', () => {
    expect(generateTypes(evaluate((v) => v, number()))).toBe('number')
  })

  it('resolves lazy schemas', () => {
    const schema = lazy(() => object({ n: number() }))
    expect(generateTypes(schema)).toBe('{\n  n: number;\n}')
  })

  it('returns any when max depth is exhausted', () => {
    expect(generateTypes(number(), { maxDepth: 0 })).toBe('any')
  })
})

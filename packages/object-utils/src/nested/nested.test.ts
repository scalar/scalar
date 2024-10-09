import { clone } from '@/clone'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { parseTypedPath, setNestedValue } from './nested'
import type { ParsePathResult } from './nested'

const nestedObj = {
  a: {
    aa: 10,
    ab: 'string',
  },
  b: 'my var',
  c: [{ name: 'one' }, { name: 'two' }],
  d: {
    da: {
      daa: {
        daaa: 10,
        daab: 11,
      },
    },
  },
}

const request = {
  tags: ['Planets'],
  summary: 'Get a planet',
  description:
    'You’ll better learn a little bit more about the planets. It might come in handy once space travel is available for everyone.',
  operationId: 'getPlanet',
  security: [{}],
  parameters: [
    {
      in: 'path',
      name: 'planetId',
      required: true,
      deprecated: false,
      schema: { type: 'integer', format: 'int64', examples: [1] },
    },
  ],
}

describe('Set a nested value', () => {
  test('Basic nested set', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(copy, 'a.ab', 'some string')

    baseObj.a.ab = 'some string'
    expect(copy).toEqual(baseObj)
    expect(copy.a.ab).toEqual('some string')
  })

  test('Nested array replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.1.name', 'three')
    copy.c[1].name = 'three'

    expect(baseObj).toEqual(copy)
  })

  test('Nested array replacement on request parameters', () => {
    const baseObj = clone(request)
    const copy = clone(request)

    setNestedValue(baseObj, 'parameters.0.schema.examples.0', 122)
    copy.parameters[0].schema.examples[0] = 122

    expect(baseObj).toEqual(copy)
  })

  test('Object replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.2', { name: 'asda' })
    copy.c[2] = { name: 'asda' }

    expect(baseObj).toEqual(copy)
  })

  test('Parse a path', () => {
    expect(parseTypedPath(request, 'parameters.0.schema.examples.0')).toEqual(
      'parameters.0.schema.examples.0',
    )
  })

  test('Parse an invalid path', () => {
    expect(parseTypedPath(request, 'parameters.stuff.others')).toBeNull()
  })
})

describe('ParsePathResult type tests', () => {
  test('Valid nested path', () => {
    type Result = ParsePathResult<typeof nestedObj, 'a.aa'>
    expectTypeOf<Result>().toEqualTypeOf<'a.aa'>()
  })

  test('Valid array path', () => {
    type Result = ParsePathResult<typeof nestedObj, 'c.0.name'>
    expectTypeOf<Result>().toEqualTypeOf<'c.0.name'>()
  })

  test('Invalid path', () => {
    type Result = ParsePathResult<typeof nestedObj, 'a.nonexistent'>
    expectTypeOf<Result>().toEqualTypeOf<null>()
  })

  test('Partial valid path', () => {
    type Result = ParsePathResult<typeof nestedObj, 'a.aa.nonexistent'>
    expectTypeOf<Result>().toEqualTypeOf<null>()
  })

  test('Deep nested path', () => {
    type Result = ParsePathResult<typeof nestedObj, 'd.da.daa.daaa'>
    expectTypeOf<Result>().toEqualTypeOf<'d.da.daa.daaa'>()
  })
})

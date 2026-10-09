import { describe, expect, it } from 'vitest'

import { clone } from '../clone'
import { setNestedValue } from './nested'

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
  description: `You'll better learn a little bit more about the planets. It might come in handy once space travel is available for everyone.`,
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
  it.each(['__proto__', 'constructor', 'prototype'])('updates existing own JSON data named %s', (key) => {
    const target: Record<string, unknown> = JSON.parse(`{"${key}":{"value":1}}`)
    setNestedValue(target, `${key}.value`, 2)
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype)
    expect(Object.getOwnPropertyDescriptor(target, key)?.value).toStrictEqual({ value: 2 })
    setNestedValue(target, key, 3)
    expect(Object.getOwnPropertyDescriptor(target, key)?.value).toBe(3)
    expect(Object.getPrototypeOf(target)).toBe(Object.prototype)
  })

  it.each(['__proto__.debugPolluted', 'constructor.prototype.debugPolluted', 'safe.__proto__.debugPolluted'])(
    'rejects unsafe path %s before mutation',
    (path) => {
      const target: Record<string, unknown> = { safe: {} }
      const before = Object.getOwnPropertyNames(Object.prototype)
      try {
        expect(() => setNestedValue(target, path, true)).toThrow('Prototype pollution key detected')
        expect(target).toStrictEqual({ safe: {} })
        expect(Object.getOwnPropertyNames(Object.prototype)).toStrictEqual(before)
      } finally {
        Reflect.deleteProperty(Object.prototype, 'debugPolluted')
      }
    },
  )

  it('does not mutate an inherited object through an otherwise ordinary path', () => {
    const inherited = { nested: { value: 1 } }
    const target = Object.create(inherited)
    expect(() => setNestedValue(target, 'nested.value', 2)).toThrow('Cannot traverse inherited or missing property')
    expect(inherited.nested.value).toBe(1)
  })

  it('Basic nested set', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(copy, 'a.ab', 'some string')

    baseObj.a.ab = 'some string'
    expect(copy).toEqual(baseObj)
    expect(copy.a.ab).toEqual('some string')
  })

  it('Nested array replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.1.name', 'three')
    if (copy.c[1]) {
      copy.c[1].name = 'three'
    }

    expect(baseObj).toEqual(copy)
  })

  it('Object replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.2', { name: 'asda' })
    copy.c[2] = { name: 'asda' }

    expect(baseObj).toEqual(copy)
  })

  it('Nested array replacement on request parameters', () => {
    const baseObj = clone(request)
    const copy = clone(request)

    setNestedValue(baseObj, 'parameters.0.schema.examples.0', 122)
    if (copy.parameters[0]?.schema?.examples?.[0]) {
      copy.parameters[0].schema.examples[0] = 122
    }

    expect(baseObj).toEqual(copy)
  })
})

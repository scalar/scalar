import { describe, expect, it } from 'vitest'

import { restoreBooleanSchemas } from './restore-boolean-schemas'

describe('restore-boolean-schemas', () => {
  it('preserves special schema names as own data properties', () => {
    const source = { components: { schemas: JSON.parse('{"__proto__":false,"constructor":true,"prototype":false}') } }
    const target = { components: { schemas: JSON.parse('{"__proto__":{},"constructor":{},"prototype":{}}') } }
    const prototype = Object.getPrototypeOf(target.components.schemas)

    restoreBooleanSchemas(source, target)

    expect(target).toStrictEqual(source)
    expect(Object.getPrototypeOf(target.components.schemas)).toBe(prototype)
    expect(Object.hasOwn(target.components.schemas, '__proto__')).toBe(true)
  })

  it.each(['default', 'example', 'examples', 'const', 'enum', 'schema', 'schemas', 'itemSchema'])(
    'restores schemas inside OpenAPI objects named %s',
    (name) => {
      const response = (): object => ({ content: { 'application/json': { schema: false } } })
      const source = {
        paths: { '/pets': { get: { responses: { [name]: response() } } } },
        components: { responses: { [name]: response() } },
      }
      const target = {
        paths: { '/pets': { get: { responses: { [name]: { content: { 'application/json': { schema: {} } } } } } } },
        components: { responses: { [name]: { content: { 'application/json': { schema: {} } } } } },
      }

      restoreBooleanSchemas(source, target)

      expect(target).toStrictEqual(source)
    },
  )

  it('restores schemas inside arrays of OpenAPI objects while keeping their examples as data', () => {
    const source = {
      get: { parameters: [{ name: 'default', in: 'query', schema: true, example: { schema: false } }] },
    }
    const target = {
      get: { parameters: [{ name: 'default', in: 'query', schema: {}, example: { schema: {} } }] },
    }

    restoreBooleanSchemas(source, target, 'document', 'pathItem')

    expect(target).toStrictEqual({
      get: { parameters: [{ name: 'default', in: 'query', schema: true, example: { schema: {} } }] },
    })
  })

  it('does not restore inherited schema entries', () => {
    const source = {
      components: { schemas: JSON.parse('{"__proto__":false,"constructor":true,"toString":false,"own":true}') },
    }
    const schemas = { own: {} }
    const prototype = Object.getPrototypeOf(schemas)

    restoreBooleanSchemas(source, { components: { schemas } })

    expect(schemas).toStrictEqual({ own: true })
    expect(Object.hasOwn(schemas, '__proto__')).toBe(false)
    expect(Object.hasOwn(schemas, 'constructor')).toBe(false)
    expect(Object.getPrototypeOf(schemas)).toBe(prototype)
  })

  it('does not invoke accessors when restoring schemas', () => {
    const calls: string[] = []
    const schemas = Object.defineProperty({}, 'value', {
      enumerable: true,
      get: () => {
        calls.push('get')
        return {}
      },
      set: () => {
        calls.push('set')
      },
    })

    restoreBooleanSchemas({ components: { schemas: { value: false } } }, { components: { schemas } })

    expect(calls).toStrictEqual([])
  })
})

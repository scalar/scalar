import { describe, expect, it } from 'vitest'

import { normalize } from './normalize'

describe('normalize', () => {
  it('returns undefined if the document is null', () => {
    expect(normalize(null)).toEqual(undefined)
  })

  it('should return the same filesystem if the specification is already a filesystem', () => {
    const filesystem = [
      {
        isEntrypoint: true,
        specification: {},
        filename: null,
        dir: './',
        references: [],
      },
    ]
    expect(normalize(filesystem)).toBe(filesystem)
  })

  it('should parse JSON string specifications', () => {
    const jsonString = '{"foo": "bar"}'
    expect(normalize(jsonString)).toEqual({ foo: 'bar' })
  })

  it('should parse YAML string specifications', () => {
    const yamlString = 'foo: bar\nbar: foo'
    expect(normalize(yamlString)).toEqual({ foo: 'bar', bar: 'foo' })
  })

  it('should handle invalid YAML with custom maxAliasCount', () => {
    const yamlString = `
      aliases: &ref
        - item1
        - item2
      items: *ref
    `
    expect(() => normalize(yamlString)).not.toThrow()
  })

  it('should return the same object if specification is already an object', () => {
    const obj = { foo: 'bar' }
    expect(normalize(obj)).toBe(obj)
  })

  it("doesn't freak out on invalid JSON strings ", () => {
    // Missing quotes around property name
    const malformedJson = '{ foo: "bar" }'
    expect(normalize(malformedJson)).toEqual(undefined)
  })

  it('should handle empty string input', () => {
    expect(normalize('')).toEqual(undefined)
  })

  it('should handle whitespace-only string input', () => {
    expect(normalize('   ')).toEqual(undefined)
  })

  it('should handle complex nested structures', () => {
    const complex = {
      nested: {
        array: [1, 2, 3],
        object: {
          foo: 'bar',
        },
      },
    }
    expect(normalize(complex)).toEqual(complex)
  })

  it('should handle invalid JSON and YAML strings gracefully', () => {
    const invalidString = 'not a valid json or yaml'
    expect(() => normalize(invalidString)).not.toThrow()
  })

  it('should handle non-string, non-object inputs', () => {
    // @ts-expect-error testing bad input
    expect(normalize(42)).toEqual(42)
    // @ts-expect-error testing bad input
    expect(normalize(true)).toEqual(true)
    // @ts-expect-error testing bad input
    expect(normalize([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should handle deeply nested structures', () => {
    const nested = { a: { b: { c: { d: { e: 'deep' } } } } }
    expect(normalize(nested)).toEqual(nested)
  })

  it('should handle large input strings', () => {
    const largeJson = JSON.stringify({ foo: 'bar'.repeat(10000) })
    expect(normalize(largeJson)).toEqual({ foo: 'bar'.repeat(10000) })
  })

  it('should handle circular references', () => {
    const circularObj: any = {}
    circularObj.self = circularObj
    expect(() => normalize(circularObj)).not.toThrow()
  })

  it('should handle special characters in strings', () => {
    const specialCharJson = '{"foo": "bar\\n"}'
    expect(normalize(specialCharJson)).toEqual({ foo: 'bar\n' })
  })
})

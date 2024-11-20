import { describe, expect, it, vi } from 'vitest'

import { makeFilesystem } from './makeFilesystem'
import { normalize } from './normalize'

describe('normalize', () => {
  it('returns filesystem as-is', () => {
    const filesystem = makeFilesystem({})

    expect(normalize(filesystem)).toBe(filesystem)
  })

  it('parses JSON string', () => {
    const jsonString = '{"foo": "bar"}'

    expect(normalize(jsonString)).toEqual({ foo: 'bar' })
  })

  it('parses YAML string', () => {
    const yamlString = 'foo: bar'

    expect(normalize(yamlString)).toEqual({ foo: 'bar' })
  })

  it('returns object as-is', () => {
    const obj = { foo: 'bar' }

    expect(normalize(obj)).toBe(obj)
  })

  it('handles YAML with aliases', () => {
    const yaml = `
foo: &ref
  bar: baz
qux: *ref
`
    expect(normalize(yaml)).toEqual({
      foo: { bar: 'baz' },
      qux: { bar: 'baz' },
    })
  })

  it('throws error with invalid YAML string', () => {
    const invalidYaml = `
openapi: 3.1.1
info:
    title: Scalar Galaxy
    spec
`
    const consoleSpy = vi.spyOn(console, 'error')
    expect(() => normalize(invalidYaml)).not.toThrow()
    expect(consoleSpy).toHaveBeenCalledWith(
      '[normalize]',
      expect.objectContaining({
        name: 'YAMLParseError',
      }),
    )
  })
})

import { describe, expect, test } from 'vitest'

import {
  isJsonString,
  json,
  parseJsonOrYaml,
  transformToJson,
  yaml,
} from './parse'

describe('yaml.parse', () => {
  test('parses basic yaml', () => {
    expect(yaml.parse(`openapi: 3.0.0`)).toEqual({
      openapi: '3.0.0',
    })
  })

  test('parses yaml number primitives', () => {
    expect(yaml.parse('10')).toStrictEqual(10)
  })
  test('parses yaml string primitives', () => {
    expect(yaml.parse('Hello World')).toStrictEqual('Hello World')
  })
  test('parses yaml null primitives', () => {
    expect(yaml.parse('null')).toStrictEqual(null)
  })
  test('parses yaml boolean primitives', () => {
    expect(yaml.parse('true')).toStrictEqual(true)
    expect(yaml.parse('false')).toStrictEqual(false)
  })
  test('parses yaml array primitives', () => {
    expect(yaml.parse('-')).toStrictEqual([null])
    expect(yaml.parse('- One\n- Two\n')).toStrictEqual(['One', 'Two'])
  })
  test('parses yaml object primitives', () => {
    expect(yaml.parse(':')).toStrictEqual({ '': null })
    expect(yaml.parse('key:')).toStrictEqual({ key: null })
    expect(yaml.parse('key: value')).toStrictEqual({ key: 'value' })
  })
  test('fails any invalid yaml', () => {
    expect(() => yaml.parse('key: 0---  \n--')).toThrowError()
  })

  test('transforms json to json', () => {
    expect(transformToJson(`openapi: 3.0.0`)).toMatchObject(
      JSON.stringify({ openapi: '3.0.0' }),
    )
  })
})

describe('json.parse', () => {
  test('parses basic json', () => {
    expect(json.parse('{ "openapi": "3.0.0" }')).toEqual({
      openapi: '3.0.0',
    })
  })

  test('parses json number primitives', () => {
    expect(json.parse('10')).toStrictEqual(10)
  })
  test('parses json string primitives', () => {
    expect(json.parse('"Hello World"')).toStrictEqual('Hello World')
  })
  test('parses json null primitives', () => {
    expect(json.parse('null')).toStrictEqual(null)
  })
  test('parses json boolean primitives', () => {
    expect(json.parse('true')).toStrictEqual(true)
    expect(json.parse('false')).toStrictEqual(false)
  })
  test('parses json array primitives', () => {
    expect(json.parse('[]')).toStrictEqual([])
  })
  test('parses json object primitives', () => {
    expect(json.parse('{}')).toStrictEqual({})
  })
  test('fails invalid json types', () => {
    expect(() => json.parse('undefined')).toThrowError()
  })
})

describe('isJsonString', () => {
  test('keeps a path as is', async () => {
    expect(isJsonString('foobar')).toBe(false)
  })

  test('removes slash', async () => {
    expect(isJsonString('{ "foo": "bar" }')).toBe(true)
  })

  test("doesn't allow objects", async () => {
    expect(isJsonString({ foo: 'bar' })).toBe(false)
  })
})

describe('parseJsonOrYaml', () => {
  test('Handles json', () => {
    expect(parseJsonOrYaml('{ "a": 10 }')).toEqual({ a: 10 })
  })

  test('Handles YAML', () => {
    expect(parseJsonOrYaml('a: 10')).toEqual({ a: 10 })
  })

  test('Throws for invalid json or yaml', () => {
    expect(() => parseJsonOrYaml('asdasdad: 0---  \n--')).toThrowError()
  })
})

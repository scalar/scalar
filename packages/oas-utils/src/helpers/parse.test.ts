import { describe, expect, test } from 'vitest'

import {
  isJsonString,
  json,
  parseJsonOrYaml,
  transformToJson,
  yaml,
} from './parse'

describe('Handles yaml and json parsing', () => {
  test('Parses basic yaml', () => {
    expect(yaml.parse(`openapi: 3.0.0`)).toEqual({
      openapi: '3.0.0',
    })

    expect(json.parse('{ "openapi": "3.0.0" }')).toEqual({
      openapi: '3.0.0',
    })
  })

  test('Fails if any type except an object is not returned', () => {
    expect(() => yaml.parse('10')).toThrowError()
    expect(() => json.parse('10')).toThrowError()
  })

  test('transforms Yaml to JSON', () => {
    expect(transformToJson(`openapi: 3.0.0`)).toMatchObject(
      JSON.stringify({ openapi: '3.0.0' }),
    )
  })
})

describe('isJsonString', () => {
  test('keeps a path as is', async () => {
    expect(isJsonString('foobar')).toBe(false)
  })

  test('removes slash', async () => {
    expect(isJsonString('{ "foo": "bar" }')).toBe(true)
  })

  test('trims whitespace', async () => {
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

  test('Throws if an object is not returned', () => {
    expect(() => parseJsonOrYaml('asda')).toThrowError()
  })
})

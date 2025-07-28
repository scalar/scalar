import { describe, expect, it } from 'vitest'

import { isJsonString, json, parseJsonOrYaml, transformToJson, yaml } from './parse'

describe('Handles yaml and json parsing', () => {
  it('Parses basic yaml', () => {
    expect(yaml.parse('openapi: 3.0.0')).toEqual({
      openapi: '3.0.0',
    })

    expect(json.parse('{ "openapi": "3.0.0" }')).toEqual({
      openapi: '3.0.0',
    })
  })

  it('Fails if any type except an object is not returned', () => {
    expect(() => yaml.parse('10')).toThrowError()
    expect(() => json.parse('10')).toThrowError()
  })

  it('transforms Yaml to JSON', () => {
    expect(transformToJson('openapi: 3.0.0')).toBe(JSON.stringify({ openapi: '3.0.0' }))
  })
})

describe('isJsonString', () => {
  it('keeps a path as is', async () => {
    expect(isJsonString('foobar')).toBe(false)
  })

  it('removes slash', async () => {
    expect(isJsonString('{ "foo": "bar" }')).toBe(true)
  })

  it('trims whitespace', async () => {
    expect(isJsonString({ foo: 'bar' })).toBe(false)
  })
})

describe('parseJsonOrYaml', () => {
  it('Handles json', () => {
    expect(parseJsonOrYaml('{ "a": 10 }')).toEqual({ a: 10 })
  })

  it('Handles YAML', () => {
    expect(parseJsonOrYaml('a: 10')).toEqual({ a: 10 })
  })

  it('Throws for invalid json or yaml', () => {
    expect(() => parseJsonOrYaml('asdasdad: 0---  \n--')).toThrowError()
  })

  it('Throws if an object is not returned', () => {
    expect(() => parseJsonOrYaml('asda')).toThrowError()
  })
})

import { describe, expect, it } from 'vitest'

import { json, parseJsonOrYaml, transformToJson, yaml } from './parse'

/**
 * `headers` is referenced ten times (nine `use` keys and `params`), so its count is 11 and every merge
 * of `base` costs 11. With yaml 2.9.1, 1,000 merges need a `maxAliasCount` of 11,011 (1,011 before
 * merges counted).
 */
const createMergeHeavyYaml = (): string =>
  [
    'headers: &headers',
    '  accept: application/json',
    ...Array.from({ length: 9 }, (_, index) => `use${index}: *headers`),
    'base: &base',
    '  type: aws',
    '  params: *headers',
    ...Array.from({ length: 1000 }, (_, index) => `item${index}:\n  <<: *base\n  title: item${index}`),
  ].join('\n')

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

  it('parses yaml whose merges exceed the old alias limit of 10,000', () => {
    expect(yaml.parse(createMergeHeavyYaml())).toHaveProperty(
      'item999',
      expect.objectContaining({ type: 'aws', title: 'item999' }),
    )
  })

  it('transforms Yaml to JSON', () => {
    expect(transformToJson('openapi: 3.0.0')).toBe(JSON.stringify({ openapi: '3.0.0' }))
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

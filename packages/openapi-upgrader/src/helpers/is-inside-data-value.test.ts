import { describe, expect, it } from 'vitest'

import { isInsideDataValue, isNamedSchemaMap } from './is-inside-data-value'

describe('isInsideDataValue', () => {
  it.each(['example', 'default', 'const', 'enum', 'x-example'])(
    'distinguishes reusable objects named %s from their data values',
    (name) => {
      for (const prefix of [['responses'], ['parameters'], ['components', 'responses'], ['components', 'parameters']]) {
        expect(isInsideDataValue([...prefix, name, 'schema'])).toBe(false)
        expect(isInsideDataValue([...prefix, name, 'schema', 'example'])).toBe(true)
        expect(isInsideDataValue([...prefix, name, 'schema', 'default'])).toBe(true)
        expect(isInsideDataValue([...prefix, name, 'examples', 'application/json', 'value'])).toBe(true)
      }
    },
  )

  it.each(['properties', 'patternProperties', '$defs', 'definitions'])(
    'distinguishes schema maps from schemas named %s',
    (name) => {
      const schema = ['components', 'schemas', name]
      const property = [...schema, 'properties', name]

      expect(isNamedSchemaMap(schema)).toBe(false)
      expect(isNamedSchemaMap([...schema, 'properties'])).toBe(true)
      expect(isNamedSchemaMap(property)).toBe(false)
      expect(isNamedSchemaMap([...property, 'properties'])).toBe(true)
      expect(isInsideDataValue([...property, 'example'])).toBe(true)
      expect(isInsideDataValue([...property, 'default'])).toBe(true)
      expect(isInsideDataValue([...property, 'properties', 'example'])).toBe(false)
    },
  )

  it.each(['properties', 'patternProperties', '$defs', 'definitions'])(
    'distinguishes reusable objects named %s from schema maps',
    (name) => {
      for (const prefix of [['responses'], ['parameters'], ['components', 'responses'], ['components', 'parameters']]) {
        const object = [...prefix, name]
        expect(isNamedSchemaMap(object)).toBe(false)
        expect(isInsideDataValue([...object, 'x-example', 'application/json'])).toBe(true)
        expect(isInsideDataValue([...object, 'example'])).toBe(true)
        expect(isNamedSchemaMap([...object, 'schema', 'properties'])).toBe(true)
      }
    },
  )

  it('distinguishes header names from data on schema properties named headers', () => {
    const header = ['paths', '/items', 'get', 'responses', '200', 'headers', 'x-example']
    expect(isInsideDataValue([...header, 'schema'])).toBe(false)
    expect(isInsideDataValue([...header, 'example'])).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'headers', 'example'])).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'headers', 'x-example'])).toBe(true)
  })

  it('preserves data keywords on schema properties named like reusable maps', () => {
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'parameters', 'example'])).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'responses', 'default'])).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'

import { isInsideDataValue, isNamedSchemaMap } from './is-inside-data-value'

describe('isInsideDataValue', () => {
  it.each(['example', 'default', 'const', 'enum', 'x-example', 'x-examples'])(
    'distinguishes reusable objects named %s from their data values',
    (name) => {
      for (const prefix of [['responses'], ['parameters'], ['components', 'responses'], ['components', 'parameters']]) {
        expect(isInsideDataValue([...prefix, name, 'schema'], '2.0')).toBe(false)
        expect(isInsideDataValue([...prefix, name, 'schema', 'example'], '2.0')).toBe(true)
        expect(isInsideDataValue([...prefix, name, 'schema', 'default'], '2.0')).toBe(true)
        expect(isInsideDataValue([...prefix, name, 'examples', 'application/json', 'value'], '2.0')).toBe(true)
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
      expect(isInsideDataValue([...property, 'example'], '2.0')).toBe(true)
      expect(isInsideDataValue([...property, 'default'], '2.0')).toBe(true)
      expect(isInsideDataValue([...property, 'properties', 'example'], '2.0')).toBe(false)
    },
  )

  it.each(['properties', 'patternProperties', '$defs', 'definitions'])(
    'distinguishes reusable objects named %s from schema maps',
    (name) => {
      for (const prefix of [['responses'], ['parameters'], ['components', 'responses'], ['components', 'parameters']]) {
        const object = [...prefix, name]
        expect(isNamedSchemaMap(object)).toBe(false)
        expect(isInsideDataValue([...object, 'x-example', 'application/json'], '2.0')).toBe(true)
        expect(isInsideDataValue([...object, 'example'], '2.0')).toBe(true)
        expect(isNamedSchemaMap([...object, 'schema', 'properties'])).toBe(true)
      }
    },
  )

  it('distinguishes header names from data on schema properties named headers', () => {
    const header = ['paths', '/items', 'get', 'responses', '200', 'headers', 'x-example']
    expect(isInsideDataValue([...header, 'schema'], '2.0')).toBe(false)
    expect(isInsideDataValue([...header, 'example'], '2.0')).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'headers', 'example'], '2.0')).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'headers', 'x-example'], '2.0')).toBe(
      true,
    )
  })

  it('distinguishes header maps from reusable objects and headers named headers', () => {
    expect(isInsideDataValue(['components', 'parameters', 'headers', 'example'], '3.0')).toBe(true)
    expect(isInsideDataValue(['parameters', 'headers', 'x-example'], '2.0')).toBe(true)
    expect(isInsideDataValue(['responses', 'headers', 'examples', 'application/json'], '2.0')).toBe(true)
    const header = ['components', 'responses', 'headers', 'headers', 'headers']
    expect(isInsideDataValue([...header, 'schema'], '3.0')).toBe(false)
    expect(isInsideDataValue([...header, 'example'], '3.0')).toBe(true)
  })

  it('limits Swagger-specific data locations to the 2.0 upgrade', () => {
    const extension = ['parameters', 'Filter', 'x-example', 'application/json']
    const responseExample = ['paths', '/items', 'get', 'responses', '200', 'examples', 'application/json']
    expect(isInsideDataValue(extension, '2.0')).toBe(true)
    expect(isInsideDataValue(extension, '3.0')).toBe(false)
    const namedExamples = ['parameters', 'Filter', 'x-examples', 'application/json', 'pet', 'value']
    expect(isInsideDataValue(namedExamples, '2.0')).toBe(true)
    expect(isInsideDataValue(namedExamples, '3.0')).toBe(false)
    expect(isInsideDataValue(responseExample, '2.0')).toBe(true)
    expect(isInsideDataValue(responseExample, '3.0')).toBe(false)
    expect(
      isInsideDataValue(['components', 'requestBodies', 'x-example', 'content', 'application/json', 'schema'], '3.0'),
    ).toBe(false)
  })

  it('preserves data keywords on schema properties named like reusable maps', () => {
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'parameters', 'example'], '2.0')).toBe(
      true,
    )
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'responses', 'default'], '2.0')).toBe(
      true,
    )
  })
})

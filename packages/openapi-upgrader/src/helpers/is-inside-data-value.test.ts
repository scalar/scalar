import { describe, expect, it } from 'vitest'

import { isInsideDataValue } from './is-inside-data-value'

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

  it('preserves data keywords on schema properties named like reusable maps', () => {
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'parameters', 'example'])).toBe(true)
    expect(isInsideDataValue(['components', 'schemas', 'Entry', 'properties', 'responses', 'default'])).toBe(true)
  })
})

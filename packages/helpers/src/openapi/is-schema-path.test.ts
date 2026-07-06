import { describe, expect, it } from 'vitest'

import { isSchemaPath } from './is-schema-path'

describe('isSchemaPath', () => {
  it('identifies schema paths', () => {
    expect(isSchemaPath(['components', 'schemas', 'User'])).toBe(true)
    expect(isSchemaPath(['paths', '/users', 'get', 'responses', '200', 'content', 'application/json', 'schema'])).toBe(
      true,
    )
    expect(isSchemaPath(['paths', '/users', 'post', 'requestBody', 'content', 'application/json', 'schema'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'User', 'properties', 'address'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'User', 'allOf', '0'])).toBe(true)
    expect(isSchemaPath(['paths', '/users', 'get', 'parameters', '0', 'schema'])).toBe(true)
  })

  it('identifies nested schema keywords', () => {
    expect(isSchemaPath(['components', 'schemas', 'Node', 'items'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'Node', 'additionalProperties'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'Node', 'anyOf', '1'])).toBe(true)
    expect(isSchemaPath(['components', 'schemas', 'Node', 'not'])).toBe(true)
    // `*Schema` keywords such as `contentSchema` also introduce a schema.
    expect(isSchemaPath(['components', 'schemas', 'File', 'contentSchema'])).toBe(true)
  })

  it('identifies non-schema paths', () => {
    expect(isSchemaPath(['info'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'summary'])).toBe(false)
    expect(isSchemaPath(['components', 'parameters', 'userId'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'responses', '200'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'parameters', '0'])).toBe(false)
  })

  it('returns false for an undefined path', () => {
    expect(isSchemaPath(undefined)).toBe(false)
  })
})

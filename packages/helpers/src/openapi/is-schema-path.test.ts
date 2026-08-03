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

  it('does not mistake user-defined names for schema keywords', () => {
    // Component names may collide with schema keywords.
    expect(isSchemaPath(['components', 'parameters', 'not'])).toBe(false)
    expect(isSchemaPath(['components', 'responses', 'ErrorSchema'])).toBe(false)
    expect(isSchemaPath(['components', 'requestBodies', 'items'])).toBe(false)
    expect(isSchemaPath(['components', 'callbacks', 'mySchema'])).toBe(false)
    // …but a real schema below such a name is still detected.
    expect(isSchemaPath(['components', 'parameters', 'not', 'schema'])).toBe(true)
    // Path templates, webhook names, header names, and example names are user-defined too.
    expect(isSchemaPath(['paths', '/fooSchema', 'get', 'summary'])).toBe(false)
    expect(isSchemaPath(['webhooks', 'items', 'post', 'requestBody'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'responses', '200', 'headers', 'X-Schema'])).toBe(false)
    expect(isSchemaPath(['paths', '/users', 'get', 'parameters', '0', 'examples', 'schema'])).toBe(false)
    // Callbacks nest a callback name and a runtime expression before the path item.
    expect(isSchemaPath(['paths', '/users', 'post', 'callbacks', 'onSchema', '{$request.body#/url}'])).toBe(false)
    expect(
      isSchemaPath([
        'paths',
        '/users',
        'post',
        'callbacks',
        'onSchema',
        '{$request.body#/url}',
        'post',
        'requestBody',
        'content',
        'application/json',
        'schema',
      ]),
    ).toBe(true)
    // OAuth2 scope names live under `scopes` and are arbitrary as well.
    expect(
      isSchemaPath(['components', 'securitySchemes', 'oauth', 'flows', 'authorizationCode', 'scopes', 'schema']),
    ).toBe(false)
  })

  it('returns false for an undefined path', () => {
    expect(isSchemaPath(undefined)).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { replaceEnvVariables, replacePathVariables, replaceVariables } from './replace-variables'

describe('replaceVariables', () => {
  it.each<{ name: string; template: string; variables: Record<string, string | number>; expected: string }>([
    {
      name: 'a single brace variable',
      template: 'https://api.example.com/{path}',
      variables: { path: 'v1' },
      expected: 'https://api.example.com/v1',
    },
    { name: 'a double brace variable', template: '{{path}}/users', variables: { path: 'v1' }, expected: 'v1/users' },
    {
      name: 'an empty string at the end',
      template: 'https://api.example.com{basePath}',
      variables: { basePath: '' },
      expected: 'https://api.example.com',
    },
    {
      name: 'an empty string in the middle',
      template: 'https://api.example.com/{path}/v1',
      variables: { path: '' },
      expected: 'https://api.example.com//v1',
    },
    {
      name: 'an empty string in double braces',
      template: 'https://api.example.com{{basePath}}',
      variables: { basePath: '' },
      expected: 'https://api.example.com',
    },
    { name: 'a zero', template: '/{page}', variables: { page: 0 }, expected: '/0' },
    {
      name: 'an empty string next to a missing variable',
      template: '{protocol}://{host}',
      variables: { protocol: '' },
      expected: '://{host}',
    },
  ])('substitutes $name', ({ template, variables, expected }) => {
    expect(replaceVariables(template, variables)).toBe(expected)
  })

  it.each<{ name: string; template: string; variables: Record<string, string> }>([
    { name: 'a missing variable', template: '{path}', variables: {} },
    { name: 'a variable with a different name', template: '{path}', variables: { other: '' } },
  ])('keeps the placeholder for $name', ({ template, variables }) => {
    expect(replaceVariables(template, variables)).toBe(template)
  })

  it('keeps an empty string returned by the callback', () => {
    expect(replaceVariables('a{b}c', () => '')).toBe('ac')
  })
})

describe('replacePathVariables', () => {
  it('replaces single curly brace variables {id}', () => {
    const path = '/users/{userId}/posts/{postId}'
    const variables = { userId: '123', postId: '456' }

    expect(replacePathVariables(path, variables)).toBe('/users/123/posts/456')
  })

  it('keeps unmatched variables unchanged when no value provided', () => {
    const path = '/api/{version}/users/{userId}/comments/{commentId}'
    const variables = { version: 'v1', userId: '42' }

    expect(replacePathVariables(path, variables)).toBe('/api/v1/users/42/comments/{commentId}')
  })
})

describe('replaceEnvVariables', () => {
  it('replaces double curly brace environment variables', () => {
    const path = '{{baseUrl}}/api/users'
    const variables = { baseUrl: 'https://api.example.com' }

    expect(replaceEnvVariables(path, variables)).toBe('https://api.example.com/api/users')
  })

  it('replaces multiple environment variables in a single string', () => {
    const path = '{{protocol}}://{{host}}:{{port}}/api'
    const variables = { protocol: 'https', host: 'localhost', port: '3000' }

    expect(replaceEnvVariables(path, variables)).toBe('https://localhost:3000/api')
  })

  it('keeps unmatched variables unchanged when no value provided', () => {
    const path = '{{baseUrl}}/api/{{version}}/users'
    const variables = { baseUrl: 'https://api.example.com' }

    expect(replaceEnvVariables(path, variables)).toBe('https://api.example.com/api/{{version}}/users')
  })

  it('does not replace single curly brace variables', () => {
    const path = '{{baseUrl}}/users/{userId}'
    const variables = { baseUrl: 'https://api.example.com', userId: '123' }

    expect(replaceEnvVariables(path, variables)).toBe('https://api.example.com/users/{userId}')
  })

  it('replaces placeholders using a callback that maps keys to values', () => {
    const path = '{{$guid}}/{{name}}'
    const replace = (key: string): string | null => {
      if (key === '$guid') {
        return '550e8400-e29b-41d4-a716-446655440000'
      }
      return key === 'name' ? 'Ada' : null
    }

    expect(replaceEnvVariables(path, replace)).toBe('550e8400-e29b-41d4-a716-446655440000/Ada')
  })

  it('leaves the original placeholder when the callback returns null', () => {
    const path = 'before {{missing}} after'
    expect(replaceEnvVariables(path, () => null)).toBe('before {{missing}} after')
  })

  it('passes the inner key to the callback for each match', () => {
    const keys: string[] = []
    replaceEnvVariables('{{a}}-{{b.c}}', (key) => {
      keys.push(key)
      return key
    })
    expect(keys).toEqual(['a', 'b.c'])
  })
})

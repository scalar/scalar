import { describe, expect, it } from 'vitest'

import { replaceEnvVariables, replacePathVariables } from './replace-variables'

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
})

import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { describe, expect, it } from 'vitest'

import { getResolvedUrl } from './get-resolved-url'

/**
 * Helper to create an environment object with optional variables.
 * Makes tests more readable by allowing partial environment definitions.
 */
const createEnvironment = (variables: XScalarEnvironment['variables'] = []): XScalarEnvironment =>
  ({
    color: 'blue',
    variables,
  }) satisfies XScalarEnvironment

/**
 * Helper to create a server object with optional URL and variables.
 * Makes tests more readable by allowing partial server definitions.
 */
const createServer = (url: string = '', variables?: ServerObject['variables']): ServerObject =>
  ({
    url,
    ...(variables && { variables }),
  }) satisfies ServerObject

describe('getResolvedUrl', () => {
  describe('basic functionality', () => {
    it('returns a simple URL without any variables', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('returns path only when server is null', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: null,
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('/users')
    })

    it('returns server URL only when path is empty', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com')
    })

    it('handles empty server and path', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer(''),
        path: '',
        pathVariables: {},
      })

      expect(result).toBe('')
    })

    it('handles path without leading slash', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: 'users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('handles server URL with trailing slash', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com/'),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })
  })

  describe('environment variable replacement', () => {
    it('replaces environment variable in server URL', () => {
      const result = getResolvedUrl({
        environment: createEnvironment([{ name: 'host', value: 'api.example.com' }]),
        server: createServer('https://{{host}}'),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('replaces environment variable in path', () => {
      const result = getResolvedUrl({
        environment: createEnvironment([{ name: 'version', value: 'v2' }]),
        server: createServer('https://api.example.com'),
        path: '/{{version}}/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/v2/users')
    })

    it('replaces multiple environment variables', () => {
      const result = getResolvedUrl({
        environment: createEnvironment([
          { name: 'host', value: 'api.example.com' },
          { name: 'version', value: 'v2' },
        ]),
        server: createServer('https://{{host}}'),
        path: '/{{version}}/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/v2/users')
    })

    it('handles environment variable with default value', () => {
      const result = getResolvedUrl({
        environment: createEnvironment([{ name: 'host', value: { default: 'api.example.com' } }]),
        server: createServer('https://{{host}}'),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('replaces single curly brace variables', () => {
      const result = getResolvedUrl({
        environment: createEnvironment([{ name: 'host', value: 'api.example.com' }]),
        server: createServer('https://{host}'),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })
  })

  describe('path variable replacement', () => {
    it('replaces path variable with double curly braces', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users/{{userId}}',
        pathVariables: { userId: '123' },
      })

      expect(result).toBe('https://api.example.com/users/123')
    })

    it('replaces path variable with single curly braces', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users/{userId}',
        pathVariables: { userId: '456' },
      })

      expect(result).toBe('https://api.example.com/users/456')
    })

    it('replaces multiple path variables', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users/{userId}/posts/{postId}',
        pathVariables: { userId: '123', postId: '789' },
      })

      expect(result).toBe('https://api.example.com/users/123/posts/789')
    })

    it('handles path variables with special characters in values', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users/{userId}',
        pathVariables: { userId: 'user-123_test' },
      })

      expect(result).toBe('https://api.example.com/users/user-123_test')
    })

    it('preserves unreplaced path variables when not provided', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users/{userId}/posts/{postId}',
        pathVariables: { userId: '123' },
      })

      expect(result).toBe('https://api.example.com/users/123/posts/{postId}')
    })
  })

  describe('server variable replacement', () => {
    it('replaces server variable with default value', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://{host}', {
          host: { default: 'api.example.com' },
        }),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('replaces multiple server variables', () => {
      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://{host}:{port}', {
          host: { default: 'api.example.com' },
          port: { default: '8080' },
        }),
        path: '/users',
        pathVariables: {},
      })

      expect(result).toBe('https://api.example.com:8080/users')
    })
  })

  describe('query parameter handling', () => {
    it('appends query parameters to the URL', () => {
      const urlParams = new URLSearchParams({ page: '1', limit: '10' })

      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users',
        pathVariables: {},
        urlParams,
      })

      expect(result).toBe('https://api.example.com/users?page=1&limit=10')
    })

    it('appends empty query parameters', () => {
      const urlParams = new URLSearchParams()

      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users',
        pathVariables: {},
        urlParams,
      })

      expect(result).toBe('https://api.example.com/users')
    })

    it('handles query parameters with special characters', () => {
      const urlParams = new URLSearchParams({ filter: 'name=John Doe', tags: 'tag1,tag2' })

      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users',
        pathVariables: {},
        urlParams,
      })

      expect(result).toContain('https://api.example.com/users?')
      expect(result).toContain('filter=name%3DJohn+Doe')
      expect(result).toContain('tags=tag1%2Ctag2')
    })

    it('handles single query parameter', () => {
      const urlParams = new URLSearchParams({ id: '123' })

      const result = getResolvedUrl({
        environment: createEnvironment(),
        server: createServer('https://api.example.com'),
        path: '/users',
        pathVariables: {},
        urlParams,
      })

      expect(result).toBe('https://api.example.com/users?id=123')
    })
  })
})

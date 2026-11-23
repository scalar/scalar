import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { processServerUrl } from './process-server-url'

describe('processServerUrl', () => {
  it('should handle server with no variables', () => {
    const server: ServerObject = {
      url: 'https://api.example.com',
    }

    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('https://api.example.com/api/users')
  })

  it('should handle server with variables', () => {
    const server: ServerObject = {
      url: 'https://{environment}.example.com',
      variables: {
        environment: {
          default: 'api',
        },
      },
    }

    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('https://api.example.com/api/users')
  })

  it('should handle server with multiple variables', () => {
    const server: ServerObject = {
      url: 'https://{environment}.{region}.example.com/{version}',
      variables: {
        environment: {
          default: 'api',
        },
        version: {
          enum: ['v1', 'v2'],
          default: 'v2',
        },
        region: {
          default: 'us-west',
        },
      },
    }

    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('https://api.us-west.example.com/v2/api/users')
  })

  it('should handle server with variables in path', () => {
    const server: ServerObject = {
      url: 'https://api.example.com/{version}',
      variables: {
        version: {
          default: 'v2',
        },
      },
    }

    const result = processServerUrl(server, '/users')
    expect(result).toBe('https://api.example.com/v2/users')
  })

  it.each<{ name: string; server: ServerObject; path: string; expected: string }>([
    {
      name: 'an empty string default at the end of the host',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { default: '' } } },
      path: '/p',
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default in the path',
      server: { url: 'https://api.example.com/{path}', variables: { path: { default: '' } } },
      path: '/p',
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default for the Galaxy server',
      server: {
        url: '{protocol}://void.scalar.com/{path}',
        variables: { protocol: { default: 'https' }, path: { default: '' } },
      },
      path: '/p',
      expected: 'https://void.scalar.com/p',
    },
    {
      name: 'an empty string default that is part of the enum',
      server: {
        url: 'https://api.example.com{basePath}',
        variables: { basePath: { default: '', enum: ['', '/v2'] } },
      },
      path: '/p',
      expected: 'https://api.example.com/p',
    },
    {
      name: 'an empty string default next to a filled default',
      server: {
        url: 'https://{region}.example.com{basePath}',
        variables: { region: { default: 'eu' }, basePath: { default: '' } },
      },
      path: '/p',
      expected: 'https://eu.example.com/p',
    },
    {
      name: 'an empty string default without a path',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { default: '' } } },
      path: '',
      expected: 'https://api.example.com',
    },
  ])('substitutes $name', ({ server, path, expected }) => {
    expect(processServerUrl(server, path)).toBe(expected)
  })

  it.each<{ name: string; server: ServerObject }>([
    {
      name: 'a variable that is missing from the variables map',
      server: { url: 'https://api.example.com{basePath}', variables: { other: { default: '' } } },
    },
    {
      name: 'a variable without a default',
      server: { url: 'https://api.example.com{basePath}', variables: { basePath: { enum: ['/v1'] } } },
    },
  ])('keeps the placeholder for $name', ({ server }) => {
    expect(processServerUrl(server, '/p')).toBe('https://api.example.com{basePath}/p')
  })

  it('should return path when server url is undefined', () => {
    const server = {} as ServerObject
    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('/api/users')
  })
})

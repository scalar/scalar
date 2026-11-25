import { getServers } from '@scalar/workspace-store/request-example'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { processServerUrl } from './process-server-url'

describe('processServerUrl', () => {
  it.each([
    { url: '{prefix}/v2', prefix: '', expected: 'https://api.example.com/v2/planets' },
    { url: '{prefix}', prefix: '', expected: 'https://api.example.com/docs/planets' },
    { url: '{prefix}', prefix: 'release.v1', expected: 'https://api.example.com/docs/release.v1/planets' },
  ])('uses $expected in snippets for $url with prefix $prefix', ({ url, prefix, expected }) => {
    const [server] = getServers([{ url, variables: { prefix: { default: prefix } } }], {
      documentUrl: 'https://api.example.com/docs/openapi.json',
    })

    expect(processServerUrl(server ?? null, '/planets')).toBe(expected)
  })

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

  it('should return path when server url is undefined', () => {
    const server = {} as ServerObject
    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('/api/users')
  })
})

import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { processServerUrl } from './process-server-url'

describe('processServerUrl', () => {
  it('should handle server with no variables', () => {
    const server: OpenAPIV3_1.ServerObject = {
      url: 'https://api.example.com',
    }

    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('https://api.example.com/api/users')
  })

  it('should handle server with variables', () => {
    const server: OpenAPIV3_1.ServerObject = {
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
    const server: OpenAPIV3_1.ServerObject = {
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
    const server: OpenAPIV3_1.ServerObject = {
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
    const server: OpenAPIV3_1.ServerObject = {}
    const result = processServerUrl(server, '/api/users')
    expect(result).toBe('/api/users')
  })
})

import type { Request } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { importCurlCommand, matchCurlToRequest, pathToRegex } from './curl'

describe('importCurlCommand', () => {
  it('should import a simple GET request', () => {
    const curlCommand = 'curl https://galaxy.scalar.com'
    const result = importCurlCommand(curlCommand)
    expect(result.method).toBe('get')
    expect(result.url).toBe('https://galaxy.scalar.com')
    expect(result.path).toBe('/')
    expect(result.headers).toEqual({})
    expect(result.parameters).toEqual([])
  })

  it('should import a POST request with JSON body', () => {
    const curlCommand =
      'curl -X POST -H "Content-Type: application/json" -d \'{"planet":"mars"}\' https://galaxy.scalar.com'
    const result = importCurlCommand(curlCommand)
    expect(result.method).toBe('post')
    expect(result.url).toBe('https://galaxy.scalar.com')
    expect(result.path).toBe('/')
    expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(result.requestBody).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              planet: { type: 'string' },
            },
          },
          example: { planet: 'mars' },
        },
      },
    })
  })

  it('should import a request with query parameters', () => {
    const curlCommand = 'curl https://galaxy.scalar.com?search=earth'
    const result = importCurlCommand(curlCommand)
    expect(result.parameters).toEqual([
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string', examples: ['earth'] },
      },
    ])
  })
})

describe('pathToRegex', () => {
  it('should convert simple path parameter template to regex', () => {
    const regex = pathToRegex('/planets/{planetId}')

    expect(regex.test('/planets/123')).toBe(true)
    expect(regex.test('/planets/earth')).toBe(true)
    expect(regex.test('/planets/mars-1')).toBe(true)
    expect(regex.test('/planets/')).toBe(false)
    expect(regex.test('/planets/nested/path')).toBe(false)
  })

  it('should handle multiple path parameters', () => {
    const regex = pathToRegex('/planets/{planetId}/moons/{moonId}')

    expect(regex.test('/planets/123/moons/456')).toBe(true)
    expect(regex.test('/planets/earth/moons/luna')).toBe(true)
    expect(regex.test('/planets/123/moons')).toBe(false)
    expect(regex.test('/planets/123/moons/')).toBe(false)
  })

  it('should handle paths with no parameters', () => {
    const regex = pathToRegex('/planets')

    expect(regex.test('/planets')).toBe(true)
    expect(regex.test('/planets/')).toBe(false)
    expect(regex.test('/planets/123')).toBe(false)
  })

  it('should escape special regex characters in path', () => {
    const regex = pathToRegex('/api/v1.0/data/{id}')

    expect(regex.test('/api/v1.0/data/123')).toBe(true)
    expect(regex.test('/api/v1.0/data/abc')).toBe(true)
    expect(regex.test('/api/v1.0/data/')).toBe(false)
  })
})

describe('matchCurlToRequest', () => {
  const mockRequest = {
    method: 'get',
    path: '/planets/{planetId}',
    type: 'request',
    uid: '1',
    selectedSecuritySchemeUids: [],
    selectedServerUid: '',
    servers: [],
    examples: [],
    responses: {},
  } satisfies Request

  it('should match a request with the path params before replacement', () => {
    const curlCommand = 'curl https://galaxy.scalar.com/planets/{planetId}'
    const result = matchCurlToRequest(curlCommand, [mockRequest])
    expect(result).toEqual(mockRequest)
  })

  it('should match a request with the path params replaced', () => {
    const curlCommand = 'curl https://galaxy.scalar.com/planets/1'
    const result = matchCurlToRequest(curlCommand, [mockRequest])
    expect(result).toEqual(mockRequest)
  })
})

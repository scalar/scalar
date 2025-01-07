import { parseCurlCommand } from '@/libs/parse-curl'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { findRequestByPathMethod, pathToRegex } from './find-request'

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

describe('findRequestByPathMethod', () => {
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
    const { method = 'get', url } = parseCurlCommand(curlCommand)
    const encodedPath = new URL(url).pathname
    const path = decodeURIComponent(encodedPath)

    const result = findRequestByPathMethod(path, method, [mockRequest])
    expect(result).toEqual(mockRequest)
  })

  it('should match a request with the path params replaced', () => {
    const curlCommand = 'curl https://galaxy.scalar.com/planets/1'
    const { method = 'get', url } = parseCurlCommand(curlCommand)
    const encodedPath = new URL(url).pathname
    const path = decodeURIComponent(encodedPath)

    const result = findRequestByPathMethod(path, method, [mockRequest])
    expect(result).toEqual(mockRequest)
  })
})

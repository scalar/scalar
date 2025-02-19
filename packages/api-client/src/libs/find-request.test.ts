import { parseCurlCommand } from '@/libs/parse-curl'
import { operationSchema } from '@scalar/oas-utils/entities/spec'
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
  const mockRequest = operationSchema.parse({
    method: 'get',
    path: '/planets/{planetId}',
    uid: 'request-1-uid',
  })

  it('should match a request with the path params before replacement', () => {
    const curlCommand = 'curl https://galaxy.scalar.com/planets/{planetId}'
    const { method = 'get', url } = parseCurlCommand(curlCommand)
    const encodedPath = new URL(url).pathname
    const path = decodeURIComponent(encodedPath)

    const { request } = findRequestByPathMethod(path, method, [mockRequest])
    expect(request).toEqual(mockRequest)
  })

  it('should match a request with the path params replaced', () => {
    const curlCommand = 'curl https://galaxy.scalar.com/planets/1'
    const { method = 'get', url } = parseCurlCommand(curlCommand)
    const encodedPath = new URL(url).pathname
    const path = decodeURIComponent(encodedPath)

    const { request, pathParams } = findRequestByPathMethod(path, method, [mockRequest])
    expect(request).toEqual(mockRequest)
    expect(pathParams).toEqual([{ key: 'planetId', value: '1' }])
  })

  it('should match a request and return path parameter values', () => {
    const _mockRequest = {
      ...mockRequest,
      path: '/planets/{planetId}/galaxies/{galaxyId}',
    }
    const curlCommand = 'curl https://galaxy.scalar.com/planets/earth/galaxies/milky-way'
    const { method = 'get', url } = parseCurlCommand(curlCommand)
    const encodedPath = new URL(url).pathname
    const path = decodeURIComponent(encodedPath)

    const { request, pathParams } = findRequestByPathMethod(path, method, [_mockRequest])
    expect(request).toEqual(_mockRequest)
    expect(pathParams).toEqual([
      { key: 'planetId', value: 'earth' },
      { key: 'galaxyId', value: 'milky-way' },
    ])
  })
})

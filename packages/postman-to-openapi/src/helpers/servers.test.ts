import { describe, expect, it } from 'vitest'

import type { ServerUsage } from './path-items'
import { analyzeServerDistribution } from './servers'

describe('servers', () => {
  it('places server at document level when used for all paths (single path)', () => {
    const serverUsage: ServerUsage[] = [
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'get',
      },
    ]

    const allUniquePaths = new Set(['/users'])
    const result = analyzeServerDistribution(serverUsage, allUniquePaths)

    expect(result.document).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.pathItems.size).toBe(0)
    expect(result.operations.size).toBe(0)
  })

  it('places server at document level when used for all paths (single path, multiple operations)', () => {
    const serverUsage: ServerUsage[] = [
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'get',
      },
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'post',
      },
    ]

    const allUniquePaths = new Set(['/users'])
    const result = analyzeServerDistribution(serverUsage, allUniquePaths)

    expect(result.document).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.pathItems.size).toBe(0)
    expect(result.operations.size).toBe(0)
  })

  it('places server at document level when used across multiple paths', () => {
    const serverUsage: ServerUsage[] = [
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'get',
      },
      {
        serverUrl: 'https://api.example.com',
        path: '/posts',
        method: 'get',
      },
    ]

    const allUniquePaths = new Set(['/users', '/posts'])
    const result = analyzeServerDistribution(serverUsage, allUniquePaths)

    expect(result.document).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.pathItems.size).toBe(0)
    expect(result.operations.size).toBe(0)
  })

  it('handles mixed server placement scenarios', () => {
    const serverUsage: ServerUsage[] = [
      // Server A: used in multiple paths → document level
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'get',
      },
      {
        serverUrl: 'https://api.example.com',
        path: '/posts',
        method: 'get',
      },
      // Server B: used in multiple operations in one path → path item level
      {
        serverUrl: 'https://api.other.com',
        path: '/comments',
        method: 'get',
      },
      {
        serverUrl: 'https://api.other.com',
        path: '/comments',
        method: 'post',
      },
      // Server C: used in only one operation → operation level
      {
        serverUrl: 'https://api.special.com',
        path: '/special',
        method: 'get',
      },
    ]

    const allUniquePaths = new Set(['/users', '/posts', '/comments', '/special'])
    const result = analyzeServerDistribution(serverUsage, allUniquePaths)

    expect(result.document).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.pathItems.size).toBe(1)
    expect(result.pathItems.get('/comments')).toEqual([
      {
        url: 'https://api.other.com',
      },
    ])
    expect(result.operations.size).toBe(1)
    expect(result.operations.get('/special:get')).toEqual([
      {
        url: 'https://api.special.com',
      },
    ])
  })

  it('handles empty server usage', () => {
    const allUniquePaths = new Set<string>()
    const result = analyzeServerDistribution([], allUniquePaths)

    expect(result.document).toEqual([])
    expect(result.pathItems.size).toBe(0)
    expect(result.operations.size).toBe(0)
  })

  it('places server at document level when used for all paths (single path, multiple operations)', () => {
    const serverUsage: ServerUsage[] = [
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'get',
      },
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'post',
      },
      {
        serverUrl: 'https://api.example.com',
        path: '/users',
        method: 'put',
      },
    ]

    const allUniquePaths = new Set(['/users'])
    const result = analyzeServerDistribution(serverUsage, allUniquePaths)

    expect(result.document).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.pathItems.size).toBe(0)
    expect(result.operations.size).toBe(0)
  })
})

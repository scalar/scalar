import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '@/types'

import { analyzeServerDistribution, parseServers } from './servers'
import type { ServerUsage } from './path-items'

describe('servers', () => {
  it('extracts server URL from collection items', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users/123',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('extracts multiple unique server URLs', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Get Post',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.other.com/posts',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
      {
        url: 'https://api.other.com',
      },
    ])
  })

  it('deduplicates server URLs', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
        {
          name: 'Create User',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('handles URLs without protocol', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'api.example.com/users',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('handles URLs with port', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com:8080/users',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com:8080',
      },
    ])
  })

  it('handles nested item groups', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Users',
          item: [
            {
              name: 'Get User',
              request: {
                method: 'GET',
                url: {
                  raw: 'https://api.example.com/users',
                },
              },
            },
          ],
        },
        {
          name: 'Posts',
          item: [
            {
              name: 'Get Post',
              request: {
                method: 'GET',
                url: {
                  raw: 'https://api.example.com/posts',
                },
              },
            },
          ],
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('handles string URL in request', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: 'https://api.example.com/users',
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('handles URL object with raw property', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('removes trailing slash from URL', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  it('returns empty array when no items are present', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = parseServers(collection)

    expect(result).toEqual([])
  })

  it('handles items without request', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Folder',
          item: [],
        },
      ],
    }

    const result = parseServers(collection)

    expect(result).toEqual([])
  })

  it('converts HTTP URLs to HTTPS', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get User',
          request: {
            method: 'GET',
            url: {
              raw: 'http://api.example.com/users',
            },
          },
        },
      ],
    }

    const result = parseServers(collection)

    // The implementation converts all URLs to HTTPS
    expect(result).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })

  describe('analyzeServerDistribution', () => {
    it('places server at operation level when used by only one operation', () => {
      const serverUsage: ServerUsage[] = [
        {
          serverUrl: 'https://api.example.com',
          path: '/users',
          method: 'get',
        },
      ]

      const result = analyzeServerDistribution(serverUsage)

      expect(result.document).toEqual([])
      expect(result.pathItems.size).toBe(0)
      expect(result.operations.size).toBe(1)
      expect(result.operations.get('/users:get')).toEqual([
        {
          url: 'https://api.example.com',
        },
      ])
    })

    it('places server at path item level when used by multiple operations in same path', () => {
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

      const result = analyzeServerDistribution(serverUsage)

      expect(result.document).toEqual([])
      expect(result.pathItems.size).toBe(1)
      expect(result.pathItems.get('/users')).toEqual([
        {
          url: 'https://api.example.com',
        },
      ])
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

      const result = analyzeServerDistribution(serverUsage)

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

      const result = analyzeServerDistribution(serverUsage)

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
      const result = analyzeServerDistribution([])

      expect(result.document).toEqual([])
      expect(result.pathItems.size).toBe(0)
      expect(result.operations.size).toBe(0)
    })

    it('deduplicates servers at the same level', () => {
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

      const result = analyzeServerDistribution(serverUsage)

      expect(result.document).toEqual([])
      expect(result.pathItems.size).toBe(1)
      expect(result.pathItems.get('/users')).toEqual([
        {
          url: 'https://api.example.com',
        },
      ])
      expect(result.operations.size).toBe(0)
    })
  })
})

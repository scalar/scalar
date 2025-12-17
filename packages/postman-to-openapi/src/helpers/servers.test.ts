import { describe, expect, it } from 'vitest'

import type { PostmanCollection } from '../types'
import { parseServers } from './servers'

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
})

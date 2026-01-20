import { describe, expect, it, test } from 'vitest'

import { convert } from './convert'
import type { PostmanCollection } from './types'

const BUCKET_NAME = 'scalar-test-fixtures'
const BUCKET_URL = `https://storage.googleapis.com/${BUCKET_NAME}`
const FIXTURES = [
  'SimplePost',
  'NoVersion',
  'Folders',
  'GetMethods',
  'PathParams',
  'MultipleServers',
  'LicenseContact',
  'ParseStatusCode',
  'NoPath',
  'DeleteOperation',
  'AuthBearer',
  'AuthBasic',
  'UrlWithPort',
  'ExternalDocs',
  'EmptyUrl',
  'XLogo',
  'AuthMultiple',
  'AuthRequest',
  'FormData',
  'FormUrlencoded',
  'RawBody',
  'OperationIds',
  'NestedServers',
  'Headers',
  'ResponsesEmpty',
  'Responses',
]

describe('fixtures', () => {
  test.each(FIXTURES)('%s', async (file) => {
    // postman
    const input = await fetch(`${BUCKET_URL}/packages/postman-to-openapi/input/${file}.json`)
    const postman = await input.json()

    // openapi
    const output = await fetch(`${BUCKET_URL}/packages/postman-to-openapi/output/${file}.json`)
    const openapi = await output.json()

    expect(convert(postman)).toEqual(openapi)
  })
})

describe('convert', () => {
  it('creates tags from nested folders without mutating the input collection', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Tags',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Parent',
          description: 'Parent folder',
          item: [
            {
              name: 'Child',
              item: [
                {
                  name: 'Leaf request',
                  request: 'https://api.scalar.com/users',
                },
              ],
            },
          ],
        },
        {
          name: 'Standalone request',
          request: 'https://api.scalar.com/status',
        },
      ],
    }

    const snapshot = JSON.parse(JSON.stringify(collection))
    const result = convert(collection)

    expect(result.tags).toEqual([{ name: 'Parent', description: 'Parent folder' }, { name: 'Parent > Child' }])
    expect(collection).toEqual(snapshot)
  })

  it('fails fast when string input is not valid JSON', () => {
    expect(() => convert('{"info": {"name": "Broken"')).toThrowError(/invalid postman collection json/i)
  })

  it('errors when required collection info is missing', () => {
    expect(() => convert({} as PostmanCollection)).toThrowError(/missing required info/i)
    expect(() =>
      convert({
        // @ts-expect-error testing runtime validation
        info: { schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
        item: [],
      }),
    ).toThrowError(/missing required info.name/i)
  })

  it('merges global and request-level security schemes', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Security',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
      },
      item: [
        {
          name: 'Users',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
            auth: {
              type: 'basic',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toEqual([{ bearerAuth: [] }])
    expect(result.components?.securitySchemes).toEqual({
      bearerAuth: {
        scheme: 'bearer',
        type: 'http',
      },
      basicAuth: {
        scheme: 'basic',
        type: 'http',
      },
    })
  })

  it('overwrites duplicate operations with last-write-wins policy', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Duplicate operations',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'First',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
        {
          name: 'Second',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/users',
          },
        },
      ],
    }

    const result = convert(collection)
    const operation = result.paths?.['/users']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('Second')
  })

  it('handles collections without items', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    }

    const result = convert(collection)

    expect(result.paths).toEqual({})
    expect(result.components).toBeUndefined()
    expect(result.tags).toBeUndefined()
  })

  it('keeps security undefined when collection has no auth', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Authless',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Ping',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/ping',
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.security).toBeUndefined()
    expect(result.components).toBeUndefined()
  })

  it('defaults requestBody content to text/plain when extractor returns empty content', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Empty body content',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Upload',
          request: {
            method: 'POST',
            url: 'https://api.scalar.com/upload',
            body: {
              mode: 'file',
              file: { src: null },
            },
          },
        },
      ],
    }

    const result = convert(collection)
    const postOperation = result.paths?.['/upload']?.post

    expect(postOperation?.requestBody).toBeDefined()
    expect(postOperation?.requestBody && 'content' in postOperation.requestBody).toBe(true)
    if (postOperation?.requestBody && 'content' in postOperation.requestBody) {
      expect(postOperation.requestBody.content).toEqual({ 'text/plain': {} })
    }
  })

  it('throws when item is not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad item',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        // @ts-expect-error invalid runtime shape
        item: {},
      }),
    ).toThrowError(/item must be an array/i)
  })

  it('errors when variables are not an array', () => {
    expect(() =>
      convert({
        info: {
          name: 'Bad variable',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [],
        // @ts-expect-error invalid runtime shape
        variable: {},
      }),
    ).toThrowError(/variable must be an array/i)
  })

  it('places servers at document level when used for all paths (single path)', () => {
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

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.get?.servers).toBeUndefined()
  })

  it('places servers at document level when used for all paths (single path, multiple operations)', () => {
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

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.get?.servers).toBeUndefined()
    expect(result.paths?.['/users']?.post?.servers).toBeUndefined()
  })

  it('places servers at document level when used across multiple paths', () => {
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
              raw: 'https://api.example.com/posts',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.servers).toBeUndefined()
    expect(result.paths?.['/posts']?.servers).toBeUndefined()
  })

  it('handles mixed server placement scenarios', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        // Server A: used in multiple paths → document level
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
              raw: 'https://api.example.com/posts',
            },
          },
        },
        // Server B: used in multiple operations in one path → path item level
        {
          name: 'Get Comment',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.other.com/comments',
            },
          },
        },
        {
          name: 'Create Comment',
          request: {
            method: 'POST',
            url: {
              raw: 'https://api.other.com/comments',
            },
          },
        },
        // Server C: used in only one operation → operation level
        {
          name: 'Get Special',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.special.com/special',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    // Server A should be at document level
    expect(result.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])

    // Server B should be at path item level
    expect(result.paths?.['/comments']?.servers).toEqual([
      {
        url: 'https://api.other.com',
      },
    ])

    // Server C should be at operation level
    expect(result.paths?.['/special']?.get?.servers).toEqual([
      {
        url: 'https://api.special.com',
      },
    ])
  })

  it('handles paths with colons correctly when placing servers at operation level', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Test API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get API v1 Users',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.example.com/api:v1/users',
            },
          },
        },
        {
          name: 'Get API v2 Posts',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.other.com/api:v2/posts',
            },
          },
        },
      ],
    }

    const result = convert(collection)

    // With multiple paths, the server for /api:v1/users should be at operation level
    // The path will be normalized, so :v1 becomes {v1}, but the delimiter fix ensures
    // that paths with colons don't break the operation key splitting
    const pathKeys = Object.keys(result.paths || {})
    expect(pathKeys.length).toBeGreaterThan(0)

    // Find the path that contains the v1 users endpoint
    const v1PathKey = pathKeys.find((key) => key.includes('v1') || key.includes('users'))
    expect(v1PathKey).toBeDefined()
    const pathItem = result.paths?.[v1PathKey!]

    // Server should be at operation level (not document level, since there are multiple paths)
    // and not path item level (since there's only one operation per path)
    expect(result.servers).toBeUndefined()
    expect(pathItem?.servers).toBeUndefined()
    expect(pathItem?.get?.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
  })
})

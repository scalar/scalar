import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it, test } from 'vitest'

import { convert } from './convert'
import type { PostmanCollection } from './types'

const BUCKET_NAME = 'scalar-test-fixtures'
const BUCKET_URL = `https://storage.googleapis.com/${BUCKET_NAME}`
const DEFAULT_RESPONSE_DESCRIPTIONS: Record<string, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No content',
  301: 'Moved permanently',
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  500: 'Internal server error',
  default: 'Default response',
}
const OPERATION_KEYS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const
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

    const normalizedOpenApi = normalizeFixtureResponseDescriptions(openapi as OpenAPIV3_1.Document)
    expect(convert(postman)).toEqual(normalizedOpenApi)
  })
})

function normalizeFixtureResponseDescriptions(document: OpenAPIV3_1.Document): OpenAPIV3_1.Document {
  const normalizedDocument = structuredClone(document)

  for (const pathItem of Object.values(normalizedDocument.paths ?? {})) {
    if (!pathItem) {
      continue
    }

    for (const key of OPERATION_KEYS) {
      const operation = pathItem[key]
      if (!operation) {
        continue
      }

      for (const [statusCode, response] of Object.entries(operation.responses ?? {})) {
        if (!response || '$ref' in response || response.description !== 'Successful response') {
          continue
        }

        response.description =
          DEFAULT_RESPONSE_DESCRIPTIONS[statusCode] ?? DEFAULT_RESPONSE_DESCRIPTIONS.default ?? 'Default response'
      }
    }
  }

  return normalizedDocument
}

describe('convert', () => {
  it('merges into an existing OpenAPI document', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Postman API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Echo',
          request: 'https://api.example.com/v2/echo',
        },
      ],
    }

    const base = {
      openapi: '3.1.0',
      info: { title: 'Existing', version: '2.0.0' },
      paths: {
        '/health': {
          get: { responses: { '200': { description: 'ok' } } },
        },
      },
      tags: [{ name: 'Core' }],
    }

    const result = convert(collection, { document: base as OpenAPIV3_1.Document })

    expect(result.info?.title).toBe('Existing')
    expect(result.paths?.['/health']).toBeDefined()
    expect(Object.keys(result.paths ?? {})).toContain('/v2/echo')
    expect(result.tags?.map((t: OpenAPIV3_1.TagObject) => t.name)).toContain('Core')
  })

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

  it('imports only requests at requestIndexPaths and keeps folder tags for those branches', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Filtered',
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

    const nestedOnly = convert(collection, { requestIndexPaths: [[0, 0, 0]] })
    expect(Object.keys(nestedOnly.paths ?? {})).toEqual(['/users'])
    expect(nestedOnly.tags).toEqual([{ name: 'Parent', description: 'Parent folder' }, { name: 'Parent > Child' }])

    const standaloneOnly = convert(collection, { requestIndexPaths: [[1]] })
    expect(Object.keys(standaloneOnly.paths ?? {})).toEqual(['/status'])
    expect(standaloneOnly.tags).toBeUndefined()

    const emptySelection = convert(collection, { requestIndexPaths: [] })
    expect(Object.keys(emptySelection.paths ?? {})).toEqual([])
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

  it('overwrites properties other than parameters and requestBody', () => {
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

  it('preserves collapsed request variants when mergeOperation is enabled', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Merged variants',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '200 - All languages',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/languages',
            description: 'All languages.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(200)'],
              },
            },
          ],
        },
        {
          name: '200 - Valid country code languages',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.scalar.com/languages?countryCode=CA',
              query: [
                {
                  key: 'countryCode',
                  value: 'CA',
                },
              ],
            },
            description: 'Languages for one country code.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "CA");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(200)'],
              },
            },
          ],
        },
        {
          name: '204 - Invalid country code filter',
          request: {
            method: 'GET',
            url: {
              raw: 'https://api.scalar.com/languages?countryCode=zz',
              query: [
                {
                  key: 'countryCode',
                  value: 'zz',
                },
              ],
            },
            description: 'No content for invalid filter.',
          },
          event: [
            {
              listen: 'prerequest',
              script: {
                exec: ['pm.environment.set("countryCode", "zz");'],
              },
            },
            {
              listen: 'test',
              script: {
                exec: ['pm.response.to.have.status(204)'],
              },
            },
          ],
        },
      ],
    }

    const result = convert(collection, { mergeOperation: true })
    const operation = result.paths?.['/languages']?.get

    expect(operation).toBeDefined()
    expect(operation?.summary).toBe('200 - All languages')
    expect(operation?.description).toBe(
      'All languages.\n\nLanguages for one country code.\n\nNo content for invalid filter.',
    )
    expect(operation?.responses).toEqual({
      '200': {
        description: 'Valid country code languages',
        content: {
          'application/json': {},
        },
      },
      '204': {
        description: 'Invalid country code filter',
        content: {
          'application/json': {},
        },
      },
    })

    const queryParam = operation?.parameters?.find(
      (parameter) => parameter.name === 'countryCode' && parameter.in === 'query',
    )
    expect(queryParam?.examples).toEqual({
      '200 - Valid country code languages': {
        value: 'CA',
        'x-disabled': false,
      },
      '204 - Invalid country code filter': {
        value: 'zz',
        'x-disabled': false,
      },
    })

    expect(operation?.['x-pre-request']).toBe(
      '// --- 200 - All languages ---\npm.environment.set("countryCode", "");\n\n// --- 200 - Valid country code languages ---\npm.environment.set("countryCode", "CA");\n\n// --- 204 - Invalid country code filter ---\npm.environment.set("countryCode", "zz");',
    )
    expect(operation?.['x-post-response']).toBe(
      '// --- 200 - All languages ---\npm.response.to.have.status(200)\n\n// --- 200 - Valid country code languages ---\npm.response.to.have.status(200)\n\n// --- 204 - Invalid country code filter ---\npm.response.to.have.status(204)',
    )
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

  it('unifies structurally equal paths using the most common path parameter name', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Path canonicalization',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get application',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/applications/{{applicationId}}',
          },
        },
        {
          name: 'Delete application',
          request: {
            method: 'DELETE',
            url: 'https://api.scalar.com/applications/{{applicationId2}}',
          },
        },
        {
          name: 'Error case with fake id',
          request: {
            method: 'GET',
            url: 'https://api.scalar.com/applications/{{fakeAppId}}',
            description: '| object | name | required |\n| --- | --- | --- |\n| path | fakeAppId | true |',
          },
        },
      ],
    }

    const result = convert(collection, { mergeOperation: true })
    const pathKeys = Object.keys(result.paths ?? {})
    expect(pathKeys).toEqual(['/applications/{applicationId}'])

    const mergedPath = result.paths?.['/applications/{applicationId}']
    expect(mergedPath?.get).toBeDefined()
    expect(mergedPath?.delete).toBeDefined()
    expect(mergedPath?.get?.parameters).toEqual([
      {
        name: 'applicationId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
  })

  it('prefers folder path-template hints when choosing canonical path parameter names', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Folder hint canonicalization',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: '/applications/{id}',
          item: [
            {
              name: 'Get application by alias',
              request: {
                method: 'GET',
                url: 'https://api.scalar.com/applications/{{applicationId}}',
                description: '| object | name | required |\n| --- | --- | --- |\n| path | applicationId | true |',
              },
            },
            {
              name: 'Delete application by fake id',
              request: {
                method: 'DELETE',
                url: 'https://api.scalar.com/applications/{{fakeAppId}}',
                description: '| object | name | required |\n| --- | --- | --- |\n| path | fakeAppId | true |',
              },
            },
          ],
        },
      ],
    }

    const result = convert(collection)
    const pathKeys = Object.keys(result.paths ?? {})
    expect(pathKeys).toEqual(['/applications/{id}'])

    const mergedPath = result.paths?.['/applications/{id}']
    expect(mergedPath?.get?.parameters).toEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
    expect(mergedPath?.delete?.parameters).toEqual([
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    ])
  })

  it('keeps server placement correct after path unification', () => {
    const collection: PostmanCollection = {
      info: {
        name: 'Server placement with unified paths',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get application by first variable',
          request: {
            method: 'GET',
            url: 'https://api.example.com/applications/{{applicationId}}',
          },
        },
        {
          name: 'Get application by second variable',
          request: {
            method: 'GET',
            url: 'https://api.example.com/applications/{{fakeAppId}}',
          },
        },
        {
          name: 'Get users from another server',
          request: {
            method: 'GET',
            url: 'https://api.other.com/users',
          },
        },
      ],
    }

    const result = convert(collection)

    expect(result.servers).toBeUndefined()
    expect(result.paths?.['/applications/{applicationId}']?.get?.servers).toEqual([
      {
        url: 'https://api.example.com',
      },
    ])
    expect(result.paths?.['/users']?.get?.servers).toEqual([
      {
        url: 'https://api.other.com',
      },
    ])
  })
})
